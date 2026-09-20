// DSA Topics Registry - Centralized Architecture for LMS DSA & Coding Preparation
// Allows seamless dynamic switching between data structures while sharing a single page UI.

import {
  easyArrayQuestions,
  mediumArrayQuestions,
  hardArrayQuestions,
  allArrayQuestions,
  allArrayPatternsList
} from './dsaArrayData'

import {
  easyStringQuestions,
  mediumStringQuestions,
  hardStringQuestions,
  allStringQuestions,
  allStringPatternsList
} from './dsaStringData'

import {
  easyLinkedListQuestions,
  mediumLinkedListQuestions,
  hardLinkedListQuestions,
  allLinkedListQuestions,
  allLinkedListPatternsList
} from './dsaLinkedListData'

import {
  stackQueueQuestions,
  allStackQueueQuestions,
  allStackQueuePatternsList,
  stackQueueCategoriesList,
  stackQueueTheory
} from './dsaStackQueueData'

import {
  hashMapQuestions,
  allHashMapQuestions,
  allHashMapPatternsList
} from './dsaHashMapData'

import {
  numberProblemsQuestions,
  allNumberProblemsQuestions,
  allNumberProblemsPatternsList
} from './dsaNumberProblemsData'

import {
  patternPrintingQuestions,
  allPatternPrintingQuestions,
  allPatternPrintingTypesList
} from './dsaPatternPrintingData'

export const dsaCategories = [
  {
    id: 'fundamentals',
    name: 'Programming Fundamentals & Logic',
    priority: 'HIGH',
    badge: 'Beginner & Aptitude Focus',
    description: 'Foundational problem-solving building blocks: loops, conditions, mathematical logic, and pattern printing.',
    topics: ['Number Based Problems', 'Pattern Printing']
  },
  {
    id: 'linear',
    name: 'Linear Data Structures',
    priority: 'HIGH',
    badge: 'Campus Placement Focus',
    description: 'Foundational sequential structures tested in 70%+ of initial technical coding assessments.',
    topics: ['Arrays', 'Strings', 'Linked List', 'Stack & Queue', 'HashMap']
  }
];

export const dsaTopicsMetadata = {
  Arrays: {
    name: 'Arrays',
    category: 'Linear Data Structures',
    priority: 'HIGH',
    status: 'available',
    shortDescription: 'Contiguous memory linear structure with index-based O(1) random access.',
    totalQuestions: 40,
    easyCount: 15,
    mediumCount: 15,
    hardCount: 10,
    tags: ['Contiguous Memory', 'Two Pointer', 'Sliding Window', 'Kadane\'s', 'Prefix Sum'],
    content: {
      easyQuestions: easyArrayQuestions,
      mediumQuestions: mediumArrayQuestions,
      hardQuestions: hardArrayQuestions,
      allQuestions: allArrayQuestions,
      patternsList: allArrayPatternsList
    }
  },

  Strings: {
    name: 'Strings',
    category: 'Linear Data Structures',
    priority: 'HIGH',
    status: 'available',
    shortDescription: 'Immutable or mutable character sequences with pattern searching and anagram matching.',
    totalQuestions: 40,
    easyCount: 15,
    mediumCount: 15,
    hardCount: 10,
    tags: ['Two Pointer', 'Sliding Window', 'Frequency Counting', 'Stack', 'Dynamic Programming'],
    content: {
      easyQuestions: easyStringQuestions,
      mediumQuestions: mediumStringQuestions,
      hardQuestions: hardStringQuestions,
      allQuestions: allStringQuestions,
      patternsList: allStringPatternsList
    }
  },

  'Linked List': {
    name: 'Linked List',
    category: 'Linear Data Structures',
    priority: 'HIGH',
    status: 'available',
    shortDescription: 'Dynamic non-contiguous nodes connected sequentially via pointers or references.',
    totalQuestions: 40,
    easyCount: 15,
    mediumCount: 15,
    hardCount: 10,
    tags: ['Fast & Slow Pointer', 'Reversal', 'Merge', 'Cycle Detection', 'Dummy Node'],
    content: {
      easyQuestions: easyLinkedListQuestions,
      mediumQuestions: mediumLinkedListQuestions,
      hardQuestions: hardLinkedListQuestions,
      allQuestions: allLinkedListQuestions,
      patternsList: allLinkedListPatternsList
    }
  },

  'Stack & Queue': {
    name: 'Stack & Queue',
    category: 'Linear Data Structures',
    priority: 'HIGH',
    status: 'available',
    shortDescription: 'LIFO and FIFO sequential abstract data structures used for expression parsing, monotonic tracking, buffering, and BFS traversal.',
    totalQuestions: 20,
    easyCount: 8,
    mediumCount: 9,
    hardCount: 3,
    tags: ['LIFO / FIFO', 'Monotonic Stack', 'Parentheses Matching', 'Sliding Window Deque', 'BFS Queue'],
    content: {
      easyQuestions: stackQueueQuestions.filter((q) => q.difficulty === 'Easy'),
      mediumQuestions: stackQueueQuestions.filter((q) => q.difficulty === 'Medium'),
      hardQuestions: stackQueueQuestions.filter((q) => q.difficulty === 'Hard'),
      allQuestions: allStackQueueQuestions,
      patternsList: allStackQueuePatternsList,
      categoriesList: stackQueueCategoriesList,
      theory: stackQueueTheory
    }
  },

  HashMap: {
    name: 'HashMap',
    category: 'Linear Data Structures',
    priority: 'HIGH',
    status: 'available',
    shortDescription: 'Key-value associative mapping data structure providing average O(1) time complexity for lookup, insertion, and deletion.',
    totalQuestions: 10,
    easyCount: 10,
    mediumCount: 0,
    hardCount: 0,
    tags: ['Key-Value', 'Frequency Counting', 'Duplicate Detection', 'Distinct Elements', 'O(1) Lookup'],
    content: {
      easyQuestions: hashMapQuestions,
      mediumQuestions: [],
      hardQuestions: [],
      allQuestions: allHashMapQuestions,
      patternsList: allHashMapPatternsList
    }
  },

  Hashing: {
    name: 'Hashing',
    category: 'Linear Data Structures',
    priority: 'HIGH',
    status: 'available',
    shortDescription: 'Key-value associative mapping data structure providing average O(1) time complexity for lookup, insertion, and deletion.',
    totalQuestions: 10,
    easyCount: 10,
    mediumCount: 0,
    hardCount: 0,
    tags: ['Key-Value', 'Frequency Counting', 'Duplicate Detection', 'Distinct Elements', 'O(1) Lookup'],
    content: {
      easyQuestions: hashMapQuestions,
      mediumQuestions: [],
      hardQuestions: [],
      allQuestions: allHashMapQuestions,
      patternsList: allHashMapPatternsList
    }
  },

  'Number Based Problems': {
    name: 'Number Based Problems',
    category: 'Programming Fundamentals & Logic',
    priority: 'HIGH',
    status: 'available',
    shortDescription: 'Foundational logic building with digit manipulation, divisibility, prime numbers, and basic mathematics.',
    totalQuestions: 20,
    easyCount: 20,
    mediumCount: 0,
    hardCount: 0,
    tags: ['Digit Manipulation', 'Divisibility', 'Prime Numbers', 'GCD / LCM', 'Basic Math'],
    content: {
      easyQuestions: numberProblemsQuestions,
      mediumQuestions: [],
      hardQuestions: [],
      allQuestions: allNumberProblemsQuestions,
      patternsList: allNumberProblemsPatternsList
    }
  },

  'Pattern Printing': {
    name: 'Pattern Printing',
    category: 'Programming Fundamentals & Logic',
    priority: 'HIGH',
    status: 'available',
    shortDescription: 'Nested loop mechanics, rows, columns, symmetry, space management, and alphanumeric pyramids.',
    totalQuestions: 20,
    easyCount: 20,
    mediumCount: 0,
    hardCount: 0,
    tags: ['Nested Loops', 'Star Patterns', 'Pyramid Logic', 'Number Patterns', 'Symmetry'],
    content: {
      easyQuestions: patternPrintingQuestions,
      mediumQuestions: [],
      hardQuestions: [],
      allQuestions: allPatternPrintingQuestions,
      patternsList: allPatternPrintingTypesList
    }
  },

  Recursion: {
    name: 'Recursion',
    category: 'Other Data Structures & Techniques',
    priority: 'SECONDARY',
    status: 'coming_soon',
    shortDescription: 'Self-referential function invocation paradigm forming the basis of backtracking and divide-and-conquer.',
    expectedPatterns: ['Subsets & Combinations', 'Permutations', 'Divide and Conquer', 'Call Stack Analysis'],
    placementRelevance: 'Foundation for mastering Trees, Graphs, and Dynamic Programming.'
  },

  'Binary Search': {
    name: 'Binary Search',
    category: 'Other Data Structures & Techniques',
    priority: 'SECONDARY',
    status: 'coming_soon',
    shortDescription: 'Logarithmic O(log N) search technique that iteratively halves search spaces based on monotonic invariants.',
    expectedPatterns: ['Search in Rotated Sorted Array', 'Binary Search on Answer', 'Lower / Upper Bound', 'Peak Finding'],
    placementRelevance: 'Standard requirement across all coding rounds requiring strict sub-linear runtime.'
  },

  Trees: {
    name: 'Trees',
    category: 'Other Data Structures & Techniques',
    priority: 'SECONDARY',
    status: 'coming_soon',
    shortDescription: 'Non-linear hierarchical data structure consisting of parent-child node relationships and paths.',
    expectedPatterns: ['DFS Traversals (Inorder/Preorder/Postorder)', 'BFS / Level Order', 'Binary Search Trees (BST)', 'LCA Finding'],
    placementRelevance: 'Top favorite topic in Amazon, Google, Flipkart, and Capgemini Exceller rounds.'
  },

  Graphs: {
    name: 'Graphs',
    category: 'Other Data Structures & Techniques',
    priority: 'SECONDARY',
    status: 'coming_soon',
    shortDescription: 'Set of vertices interconnected by directed or undirected edges modeling complex networks.',
    expectedPatterns: ['BFS / DFS Traversal', 'Cycle Detection', 'Dijkstra Shortest Path', 'Topological Sort / Kahn\'s Algorithm'],
    placementRelevance: 'Benchmark topic for SDE-1 product hiring and high-package campus offers.'
  },

  Heap: {
    name: 'Heap',
    category: 'Other Data Structures & Techniques',
    priority: 'SECONDARY',
    status: 'coming_soon',
    shortDescription: 'Complete binary tree structure implementing Priority Queues with O(log N) min/max retrieval.',
    expectedPatterns: ['K-th Largest / Smallest Element', 'Top K Frequent Elements', 'Merge K Sorted Lists', 'Median from Data Stream'],
    placementRelevance: 'Frequently asked in online assessments where sorting entire arrays is too slow.'
  },

  'Dynamic Programming': {
    name: 'Dynamic Programming',
    category: 'Other Data Structures & Techniques',
    priority: 'SECONDARY',
    status: 'coming_soon',
    shortDescription: 'Mathematical optimization technique breaking complex problems into overlapping subproblems with memoization.',
    expectedPatterns: ['1D DP (Fibonacci, Climbing Stairs)', '0/1 Knapsack & Unbounded Knapsack', 'Longest Common Subsequence (LCS)', 'Matrix Chain / Grid DP'],
    placementRelevance: 'Differentiator for high-paying dream and super-dream campus placement roles.'
  }
};
