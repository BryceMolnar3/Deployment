import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend for server rendering
import matplotlib.pyplot as plt
import numpy as np
import base64
import re
import random
from io import BytesIO
from collections import defaultdict
import math
import os

from django.conf import settings
from pymongo import MongoClient
from .models import ComparisonResult

class PhylogeneticTreeBuilder:
    def __init__(self):
        # Use environment variables for MongoDB connection
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        db_name = os.getenv('MONGODB_DB_NAME', 'document_db')
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.documents = self.db['documents']
    
    def _calculate_total_word_count(self):
        """
        Calculate the total word count from all manuscripts.
        Returns the maximum word count found across all manuscripts.
        """
        try:
            # Get all manuscripts and find the maximum word count
            manuscripts = self.documents.find({}, {'content': 1})
            max_word_count = 0
            for ms in manuscripts:
                if 'content' in ms:
                    # Count words in content
                    word_count = len(ms['content'].split())
                    max_word_count = max(max_word_count, word_count)
            return max(max_word_count, 1)  # Ensure at least 1 to avoid division by zero
        except Exception as e:
            print(f"Warning: Error calculating word count: {e}")
            return 200  # Fallback to default if calculation fails

    def _build_presence_absence_map(self):
        """
        Build a dictionary that maps each manuscript_sigla -> set of difference IDs.
        A 'difference ID' is a string describing a unique variant location, e.g.:
            "verse10_pos3_abc_vs_ab"

        We also ensure that there is a base case labeled "1" with an *empty* set of
        differences, so it always appears in the dataset.
        """
        from django.db.models import F

        # Gather all "significant" ComparisonResults
        significant_comps = (
            ComparisonResult.objects
            .filter(is_significant=True)
            .select_related('word_comparison')
        )

        presence_map = defaultdict(set)  # ms_label -> set of difference IDs

        for comp in significant_comps:
            wc = comp.word_comparison
            if not wc:
                continue

            # Normalize the manuscript_sigla (remove .docx, etc.)
            ms_label = re.sub(r'\.docx$', '', wc.manuscript_sigla or '', flags=re.IGNORECASE).strip()
            if not ms_label:  # Skip if label is empty after normalization
                continue

            # Construct a unique difference ID
            diff_id = f"verse{wc.verse_number}_pos{wc.position}_{wc.word1}_vs_{wc.word2}"

            # Add it to that manuscript's set of differences
            presence_map[ms_label].add(diff_id)

        # Validate base case manuscript exists
        base_case = "1"
        if base_case not in presence_map:
            # Check if manuscript "1" exists in the database
            base_manuscript = self.documents.find_one({'filename': base_case})
            if base_manuscript:
                presence_map[base_case] = set()
            else:
                print(f"Warning: Base case manuscript '{base_case}' not found in database")

        return presence_map

    def _compute_distance_matrix(self, presence_map):
        """
        Instead of Jaccard, we'll treat each set_i as 'positions that differ'.
        Then, the distance between two manuscripts i & j is:
        
            dist(i,j) = number_of_positions_where_i_and_j_disagree / TOTAL_WORD_COUNT

        i.e. the size of the symmetric difference of their difference sets,
        divided by total text length. If one MS is identical to base "1"
        (which has 0 differences), that distance is (1 / TOTAL_WORD_COUNT), etc.
        """
        
        TOTAL_WORD_COUNT = self._calculate_total_word_count()

        labels = sorted(presence_map.keys())
        n = len(labels)
        if n < 2:
            raise ValueError(
                "Not enough manuscripts to build a distance matrix; only the base '1' found."
            )

        distance_matrix = np.zeros((n, n), dtype=float)

        for i in range(n):
            for j in range(i+1, n):
                set_i = presence_map[labels[i]]
                set_j = presence_map[labels[j]]
                
                diff_count = len(set_i.symmetric_difference(set_j))
                dist = diff_count / TOTAL_WORD_COUNT

                distance_matrix[i, j] = dist
                distance_matrix[j, i] = dist

        return distance_matrix, labels

    def _max_pairwise_dist(self, clusterA, clusterB, distance_matrix):
        """
        For merging two clusters A and B in complete-linkage, the diameter is:
          max( clusterA.diameter, clusterB.diameter, any pairwise dist in A x B )
        """
        max_d = max(clusterA["diameter"], clusterB["diameter"])
        for x in clusterA["items"]:
            for y in clusterB["items"]:
                max_d = max(max_d, distance_matrix[x, y])
        return max_d

    def _complete_linkage_clustering(self, distance_matrix, labels):
        """
        Manual complete-linkage. Each node is a dict:
          {
            'items': list of leaf indices,
            'diameter': float,
            'left': child node or None,
            'right': child node or None,
            'label': string or None if leaf
          }
        """
        n = len(labels)
        # Initially, each manuscript is a leaf
        clusters = []
        for i in range(n):
            clusters.append({
                "items": [i],
                "diameter": 0.0,
                "left": None,
                "right": None,
                "label": labels[i],  # leaf label
            })

        # Merge until one remains
        while len(clusters) > 1:
            best_pair = None
            best_diameter = math.inf

            # Find the pair that yields smallest new diameter
            for i in range(len(clusters)):
                for j in range(i+1, len(clusters)):
                    merged_diam = self._max_pairwise_dist(clusters[i], clusters[j], distance_matrix)
                    if merged_diam < best_diameter:
                        best_diameter = merged_diam
                        best_pair = (i, j)

            i, j = best_pair
            A = clusters[i]
            B = clusters[j]
            merged = {
                "items": A["items"] + B["items"],
                "diameter": best_diameter,
                "left": A,
                "right": B,
                "label": None,  # internal node => no label
            }

            # Remove them and add the merged
            if i > j:
                i, j = j, i
            del clusters[j]
            del clusters[i]
            clusters.append(merged)

        return clusters[0]  # root

    def generate_complete_linkage_tree_from_significant_differences(self):
        """
        Returns the root of the final binary tree (dict).
        """
        presence_map = self._build_presence_absence_map()
        if not presence_map:
            raise ValueError("No significant differences found, and no manuscripts labeled '1' either.")

        distance_matrix, labels = self._compute_distance_matrix(presence_map)
        root = self._complete_linkage_clustering(distance_matrix, labels)
        return root

    def print_tree(self, node, indent=0):
        """
        Print the tree structure to console for debugging.
        """
        prefix = "  " * indent
        if node["label"] is not None:
            print(f"{prefix}- Leaf: label={node['label']}, diameter={node['diameter']:.3f}")
        else:
            print(f"{prefix}+ Node: diameter={node['diameter']:.3f}, items={node['items']}")
            self.print_tree(node["left"], indent+1)
            self.print_tree(node["right"], indent+1)

    def export_newick(self, node):
        """
        Convert the final tree structure into a Newick string for external usage.
        Each internal node => branch length = diameter/2.
        
        Args:
            node (dict): The tree node to convert
            
        Returns:
            str: The Newick format tree string
        """
        if node["label"] is not None:
            # Properly escape special characters in labels
            safe_label = node["label"]
            # Replace special characters with underscores
            safe_label = re.sub(r'[,:();\s]+', '_', safe_label)
            # Escape any remaining special characters
            safe_label = re.sub(r'[^a-zA-Z0-9_\-\.]', lambda m: f'\\{m.group(0)}', safe_label)
            return safe_label

        left_sub = self.export_newick(node["left"])
        right_sub = self.export_newick(node["right"])
        dist = node["diameter"] / 2.0
        return f"({left_sub}:{dist:.6f},{right_sub}:{dist:.6f})"

    def generate_newick_complete_linkage_tree(self):
        root = self.generate_complete_linkage_tree_from_significant_differences()
        newick = self.export_newick(root) + ";"
        return newick

    def generate_cluster_tree_image(self, output_format='base64'):
        """
        Generate a phylogenetic tree image from significant differences.
        
        Args:
            output_format (str): The desired output format ('base64', 'png', 'svg', or 'newick')
            
        Returns:
            str: The tree image in the requested format
            
        Raises:
            ValueError: If the output format is not supported
            Exception: If tree generation fails
        """
        try:
            # Generate the tree
            root = self.generate_complete_linkage_tree_from_significant_differences()
            if not root:
                raise ValueError("Failed to generate tree: No valid data available")

            if output_format == 'newick':
                newick_tree = self.export_newick(root)
                if not newick_tree:
                    raise ValueError("Failed to generate Newick format tree")
                return newick_tree

            # Create the plot
            plt.clf()  # Clear any existing plots
            fig, ax = plt.subplots(figsize=(10, 8))
            
            # Draw the tree
            self._draw_edges(root, ax)
            
            # Set plot properties
            ax.set_axis_off()
            plt.tight_layout()
            
            # Convert to requested format
            buffer = BytesIO()
            if output_format == 'svg':
                plt.savefig(buffer, format='svg', bbox_inches='tight')
                mime_type = 'image/svg+xml'
            else:  # default to png
                plt.savefig(buffer, format='png', bbox_inches='tight')
                mime_type = 'image/png'
            
            # Clean up matplotlib resources
            plt.close(fig)
            
            # Convert to base64 if requested
            if output_format == 'base64':
                buffer.seek(0)
                image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                return image_base64
            
            return buffer.getvalue()

        except Exception as e:
            plt.close('all')  # Ensure all plots are closed on error
            raise Exception(f"Tree generation failed: {str(e)}")

    def __del__(self):
        """Cleanup method to ensure MongoDB connection is closed"""
        try:
            self.client.close()
        except:
            pass  # Ignore errors during cleanup

    # ---------------------------------------------------
    # HELPER FUNCTIONS FOR LAYOUT & DRAWING
    # ---------------------------------------------------

    def _assign_y_positions(self, node, current_y=0):
        if node["label"] is not None:
            node["y"] = float(current_y)
            return current_y + 1
        else:
            next_y = self._assign_y_positions(node["left"], current_y)
            next_y = self._assign_y_positions(node["right"], next_y)
            left_y = node["left"]["y"]
            right_y = node["right"]["y"]
            node["y"] = (left_y + right_y) / 2.0
            return next_y

    def _assign_x_positions(self, node):
        node["x"] = float(node["diameter"])
        if node["left"] is not None:
            self._assign_x_positions(node["left"])
        if node["right"] is not None:
            self._assign_x_positions(node["right"])

    def _gather_nodes(self, node, collection):
        collection.append(node)
        if node["left"] is not None:
            self._gather_nodes(node["left"], collection)
        if node["right"] is not None:
            self._gather_nodes(node["right"], collection)

    def _draw_edges(self, node, ax):
        """
        Draw edges from this node to children with mild alpha or color for clarity.
        """
        if node["left"] is not None:
            # Optional: random color or just black with alpha
            #edge_color = f"#{random.randint(0, 0xFFFFFF):06x}"
            edge_color = "black"
            self._draw_line(ax, node, node["left"], color=edge_color)
            self._draw_edges(node["left"], ax)

        if node["right"] is not None:
            #edge_color = f"#{random.randint(0, 0xFFFFFF):06x}"
            edge_color = "black"
            self._draw_line(ax, node, node["right"], color=edge_color)
            self._draw_edges(node["right"], ax)

    def _draw_line(self, ax, parent, child, color='black'):
        px, py = parent["x"], parent["y"]
        cx, cy = child["x"], child["y"]
        # L-shape for horizontal phylogram
        ax.plot([px, cx], [py, cy], color=color, linewidth=1, alpha=0.8)
