// DSA Array Coding Questions Bank - Placement Preparation
// Conceptual References: Striver's A2Z DSA Sheet, GeeksforGeeks SDE Sheet, LeetCode Official Problems

export const easyArrayQuestions = [
  {
    id: "e1",
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Hashing",
    question: "Given an array of integers and an integer target, find the indices of two elements such that their sum equals the target.",
    leetcode: {
      available: true,
      problem_title: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/"
    }
  },
  {
    id: "e2",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Greedy",
    question: "Given an array representing stock prices across consecutive days, find the maximum profit that can be achieved by choosing a single day to buy one stock and choosing a subsequent day in the future to sell it.",
    leetcode: {
      available: true,
      problem_title: "Best Time to Buy and Sell Stock",
      url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"
    }
  },
  {
    id: "e3",
    title: "Remove Duplicates from Sorted Array",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Two Pointer",
    question: "Given an integer array sorted in non-decreasing order, remove duplicate elements in-place such that each unique element appears only once, and return the number of unique elements.",
    leetcode: {
      available: true,
      problem_title: "Remove Duplicates from Sorted Array",
      url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/"
    }
  },
  {
    id: "e4",
    title: "Move Zeroes",
    difficulty: "Easy",
    topic: "Array",
    pattern: "In-place Array Manipulation",
    question: "Given an integer array, relocate all zero elements to the end of the array while maintaining the relative order of the non-zero elements in-place.",
    leetcode: {
      available: true,
      problem_title: "Move Zeroes",
      url: "https://leetcode.com/problems/move-zeroes/"
    }
  },
  {
    id: "e5",
    title: "Check if Array is Sorted and Rotated",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Array Traversal",
    question: "Given an array of integers, determine whether the array was originally sorted in non-decreasing order and then rotated by some number of positions.",
    leetcode: {
      available: true,
      problem_title: "Check if Array Is Sorted and Rotated",
      url: "https://leetcode.com/problems/check-if-array-is-sorted-and-rotated/"
    }
  },
  {
    id: "e6",
    title: "Missing Number",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Mathematical Approach",
    question: "Given an array containing n distinct integers taken from the range 0 to n, find the single number from that range that is missing in the array.",
    leetcode: {
      available: true,
      problem_title: "Missing Number",
      url: "https://leetcode.com/problems/missing-number/"
    }
  },
  {
    id: "e7",
    title: "Maximum Consecutive Ones",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Array Traversal",
    question: "Given a binary array containing only zeros and ones, calculate the maximum count of consecutive ones present in the array.",
    leetcode: {
      available: true,
      problem_title: "Max Consecutive Ones",
      url: "https://leetcode.com/problems/max-consecutive-ones/"
    }
  },
  {
    id: "e8",
    title: "Single Number",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Mathematical Approach",
    question: "Given a non-empty array of integers where every element appears exactly twice except for one unique element, find and return that unique element.",
    leetcode: {
      available: true,
      problem_title: "Single Number",
      url: "https://leetcode.com/problems/single-number/"
    }
  },
  {
    id: "e9",
    title: "Find Largest and Second Largest Element",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Array Traversal",
    question: "Given an array of positive integers, identify the largest and the second largest distinct elements present in the array without performing any sorting operations.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "e10",
    title: "Left Rotate Array by K Places",
    difficulty: "Easy",
    topic: "Array",
    pattern: "In-place Array Manipulation",
    question: "Given an array of integers, rotate all elements of the array to the left by k positions in-place.",
    leetcode: {
      available: true,
      problem_title: "Rotate Array",
      url: "https://leetcode.com/problems/rotate-array/"
    }
  },
  {
    id: "e11",
    title: "Find Pivot Index",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Prefix Sum",
    question: "Given an array of integers, determine the pivot index where the sum of all elements strictly to the left of the index equals the sum of all elements strictly to its right.",
    leetcode: {
      available: true,
      problem_title: "Find Pivot Index",
      url: "https://leetcode.com/problems/find-pivot-index/"
    }
  },
  {
    id: "e12",
    title: "Intersection of Two Arrays",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Hashing",
    question: "Given two integer arrays, find their intersection such that each element in the resulting collection is unique.",
    leetcode: {
      available: true,
      problem_title: "Intersection of Two Arrays",
      url: "https://leetcode.com/problems/intersection-of-two-arrays/"
    }
  },
  {
    id: "e13",
    title: "Binary Search",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Binary Search",
    question: "Given an integer array sorted in ascending order and a target value, determine whether the target exists in the array and return its index.",
    leetcode: {
      available: true,
      problem_title: "Binary Search",
      url: "https://leetcode.com/problems/binary-search/"
    }
  },
  {
    id: "e14",
    title: "Squares of a Sorted Array",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Two Pointer",
    question: "Given an integer array sorted in non-decreasing order, return an array of the squares of each number sorted in non-decreasing order.",
    leetcode: {
      available: true,
      problem_title: "Squares of a Sorted Array",
      url: "https://leetcode.com/problems/squares-of-a-sorted-array/"
    }
  },
  {
    id: "e15",
    title: "Majority Element",
    difficulty: "Easy",
    topic: "Array",
    pattern: "Hashing",
    question: "Given an array of integers of size n, identify the majority element that appears more than n / 2 times in the array.",
    leetcode: {
      available: true,
      problem_title: "Majority Element",
      url: "https://leetcode.com/problems/majority-element/"
    }
  }
];

export const mediumArrayQuestions = [
  {
    id: "m1",
    title: "Maximum Subarray Sum",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Kadane's Algorithm",
    question: "Given an integer array, find the contiguous subarray containing at least one element that produces the largest sum, and return that sum.",
    leetcode: {
      available: true,
      problem_title: "Maximum Subarray",
      url: "https://leetcode.com/problems/maximum-subarray/"
    }
  },
  {
    id: "m2",
    title: "Sort Colors (0s, 1s, and 2s)",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Two Pointer",
    question: "Given an array containing objects colored red, white, or blue (represented by numbers 0, 1, and 2), sort the array in-place so that all 0s appear first, followed by all 1s, and finally all 2s.",
    leetcode: {
      available: true,
      problem_title: "Sort Colors",
      url: "https://leetcode.com/problems/sort-colors/"
    }
  },
  {
    id: "m3",
    title: "Next Permutation",
    difficulty: "Medium",
    topic: "Array",
    pattern: "In-place Array Manipulation",
    question: "Given an array of integers representing a permutation, rearrange the numbers into the lexicographically next greater permutation; if no greater arrangement is possible, rearrange into the lowest possible order.",
    leetcode: {
      available: true,
      problem_title: "Next Permutation",
      url: "https://leetcode.com/problems/next-permutation/"
    }
  },
  {
    id: "m4",
    title: "Rearrange Array Elements by Sign",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Two Pointer",
    question: "Given an even-length integer array containing equal numbers of positive and negative numbers, rearrange the elements such that every consecutive pair alternates signs while preserving the relative ordering of elements with the same sign.",
    leetcode: {
      available: true,
      problem_title: "Rearrange Array Elements by Sign",
      url: "https://leetcode.com/problems/rearrange-array-elements-by-sign/"
    }
  },
  {
    id: "m5",
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Hashing",
    question: "Given an unsorted array of integers, find the length of the longest sequence of consecutive integer values.",
    leetcode: {
      available: true,
      problem_title: "Longest Consecutive Sequence",
      url: "https://leetcode.com/problems/longest-consecutive-sequence/"
    }
  },
  {
    id: "m6",
    title: "Subarray Sum Equals K",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Prefix Sum",
    question: "Given an array of integers and an integer k, determine the total count of continuous subarrays whose elements sum exactly to k.",
    leetcode: {
      available: true,
      problem_title: "Subarray Sum Equals K",
      url: "https://leetcode.com/problems/subarray-sum-equals-k/"
    }
  },
  {
    id: "m7",
    title: "Merge Intervals",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Sorting",
    question: "Given an array of intervals where each interval has a start and end value, merge all overlapping intervals and return a collection of mutually exclusive intervals covering the entire range.",
    leetcode: {
      available: true,
      problem_title: "Merge Intervals",
      url: "https://leetcode.com/problems/merge-intervals/"
    }
  },
  {
    id: "m8",
    title: "3Sum",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Two Pointer",
    question: "Given an integer array, find all unique triplets such that the sum of the three distinct elements equals zero, ensuring no duplicate triplets are included in the result.",
    leetcode: {
      available: true,
      problem_title: "3Sum",
      url: "https://leetcode.com/problems/3sum/"
    }
  },
  {
    id: "m9",
    title: "Container With Most Water",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Two Pointer",
    question: "Given an integer array where each value represents the height of vertical lines drawn at coordinate positions, find two lines that together with the x-axis form a container holding the maximum possible water volume.",
    leetcode: {
      available: true,
      problem_title: "Container With Most Water",
      url: "https://leetcode.com/problems/container-with-most-water/"
    }
  },
  {
    id: "m10",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Prefix and Suffix",
    question: "Given an integer array, construct an output array where each element at index i equals the product of all elements of the input array except the element at index i, without using the division operator.",
    leetcode: {
      available: true,
      problem_title: "Product of Array Except Self",
      url: "https://leetcode.com/problems/product-of-array-except-self/"
    }
  },
  {
    id: "m11",
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Binary Search",
    question: "Given an array of distinct integers sorted in ascending order that has been rotated at an unknown pivot, find the index of a given target value.",
    leetcode: {
      available: true,
      problem_title: "Search in Rotated Sorted Array",
      url: "https://leetcode.com/problems/search-in-rotated-sorted-array/"
    }
  },
  {
    id: "m12",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Sliding Window",
    question: "Given an array of characters (or string), compute the maximum length of a contiguous sequence of elements that contains no duplicate characters.",
    leetcode: {
      available: true,
      problem_title: "Longest Substring Without Repeating Characters",
      url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/"
    }
  },
  {
    id: "m13",
    title: "Set Matrix Zeroes",
    difficulty: "Medium",
    topic: "Array",
    pattern: "In-place Array Manipulation",
    question: "Given an m x n integer matrix, if any element is 0, update its entire row and its entire column to 0 in-place.",
    leetcode: {
      available: true,
      problem_title: "Set Matrix Zeroes",
      url: "https://leetcode.com/problems/set-matrix-zeroes/"
    }
  },
  {
    id: "m14",
    title: "Rotate Image / Matrix by 90 Degrees Clockwise",
    difficulty: "Medium",
    topic: "Array",
    pattern: "In-place Array Manipulation",
    question: "Given an n x n 2D matrix representing an image, rotate the entire matrix 90 degrees clockwise in-place.",
    leetcode: {
      available: true,
      problem_title: "Rotate Image",
      url: "https://leetcode.com/problems/rotate-image/"
    }
  },
  {
    id: "m15",
    title: "Majority Element II",
    difficulty: "Medium",
    topic: "Array",
    pattern: "Hashing",
    question: "Given an integer array of size n, identify all distinct elements that appear more than n / 3 times in the array.",
    leetcode: {
      available: true,
      problem_title: "Majority Element II",
      url: "https://leetcode.com/problems/majority-element-ii/"
    }
  }
];

export const hardArrayQuestions = [
  {
    id: "h1",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    topic: "Array",
    pattern: "Two Pointer",
    question: "Given an array of non-negative integers representing an elevation map where each bar has unit width, compute the total amount of rainwater it can trap after raining.",
    leetcode: {
      available: true,
      problem_title: "Trapping Rain Water",
      url: "https://leetcode.com/problems/trapping-rain-water/"
    }
  },
  {
    id: "h2",
    title: "Sliding Window Maximum",
    difficulty: "Hard",
    topic: "Array",
    pattern: "Deque",
    question: "Given an array of integers and a sliding window of size k moving from left to right, determine the maximum value observed in each window position.",
    leetcode: {
      available: true,
      problem_title: "Sliding Window Maximum",
      url: "https://leetcode.com/problems/sliding-window-maximum/"
    }
  },
  {
    id: "h3",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    topic: "Array",
    pattern: "Deque",
    question: "Given an array of integers representing the heights of adjacent histogram bars with unit width, compute the area of the largest rectangle that can be constructed within the histogram.",
    leetcode: {
      available: true,
      problem_title: "Largest Rectangle in Histogram",
      url: "https://leetcode.com/problems/largest-rectangle-in-histogram/"
    }
  },
  {
    id: "h4",
    title: "Count Inversions in an Array",
    difficulty: "Hard",
    topic: "Array",
    pattern: "Merge Sort",
    question: "Given an array of integers, count the total number of inversions, where an inversion is defined as any pair of indices (i, j) such that i < j and arr[i] > arr[j].",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "h5",
    title: "Reverse Pairs",
    difficulty: "Hard",
    topic: "Array",
    pattern: "Merge Sort",
    question: "Given an integer array, return the count of reverse pairs, where a reverse pair is defined as an index pair (i, j) satisfying i < j and arr[i] > 2 * arr[j].",
    leetcode: {
      available: true,
      problem_title: "Reverse Pairs",
      url: "https://leetcode.com/problems/reverse-pairs/"
    }
  },
  {
    id: "h6",
    title: "Maximum Product Subarray",
    difficulty: "Hard",
    topic: "Array",
    pattern: "Kadane's Algorithm",
    question: "Given an integer array, find the contiguous non-empty subarray that yields the largest multiplication product, and return that product.",
    leetcode: {
      available: true,
      problem_title: "Maximum Product Subarray",
      url: "https://leetcode.com/problems/maximum-product-subarray/"
    }
  },
  {
    id: "h7",
    title: "Merge Two Sorted Arrays Without Extra Space",
    difficulty: "Hard",
    topic: "Array",
    pattern: "In-place Array Manipulation",
    question: "Given two sorted integer arrays of lengths m and n, merge the second array into the first array as one combined sorted array in-place without utilizing auxiliary memory.",
    leetcode: {
      available: true,
      problem_title: "Merge Sorted Array",
      url: "https://leetcode.com/problems/merge-sorted-array/"
    }
  },
  {
    id: "h8",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    topic: "Array",
    pattern: "Binary Search",
    question: "Given two sorted arrays of lengths m and n respectively, find the median value of the two merged sorted arrays with logarithmic time complexity.",
    leetcode: {
      available: true,
      problem_title: "Median of Two Sorted Arrays",
      url: "https://leetcode.com/problems/median-of-two-sorted-arrays/"
    }
  },
  {
    id: "h9",
    title: "First Missing Positive",
    difficulty: "Hard",
    topic: "Array",
    pattern: "In-place Array Manipulation",
    question: "Given an unsorted integer array, find the smallest positive integer that is not present in the array, using linear runtime and constant auxiliary space.",
    leetcode: {
      available: true,
      problem_title: "First Missing Positive",
      url: "https://leetcode.com/problems/first-missing-positive/"
    }
  },
  {
    id: "h10",
    title: "Subarrays with K Different Integers",
    difficulty: "Hard",
    topic: "Array",
    pattern: "Sliding Window",
    question: "Given an integer array and an integer k, calculate the number of good continuous subarrays that contain exactly k distinct integer values.",
    leetcode: {
      available: true,
      problem_title: "Subarrays with K Different Integers",
      url: "https://leetcode.com/problems/subarrays-with-k-different-integers/"
    }
  }
];

export const allArrayQuestions = [
  ...easyArrayQuestions,
  ...mediumArrayQuestions,
  ...hardArrayQuestions
];

export const allArrayPatternsList = [
  "All Patterns",
  "Array Traversal",
  "Mathematical Approach",
  "Hashing",
  "Two Pointer",
  "Sliding Window",
  "Prefix Sum",
  "Kadane's Algorithm",
  "Sorting",
  "Greedy",
  "Binary Search",
  "Prefix and Suffix",
  "Merge Sort",
  "Deque",
  "In-place Array Manipulation"
];
