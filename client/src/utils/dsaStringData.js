// DSA String Coding Questions Bank - Placement Preparation
// Conceptual References: Striver's A2Z DSA Sheet, GeeksforGeeks SDE Sheet, LeetCode Official Problems

export const easyStringQuestions = [
  {
    id: "sE1",
    title: "Reverse a String",
    difficulty: "Easy",
    topic: "String",
    pattern: "Two Pointer",
    question: "Given a character array or string, write a function that reverses the string in-place by manipulating pointers from both ends.",
    leetcode: {
      available: true,
      problem_title: "Reverse String",
      url: "https://leetcode.com/problems/reverse-string/"
    }
  },
  {
    id: "sE2",
    title: "Check if a String is Palindrome",
    difficulty: "Easy",
    topic: "String",
    pattern: "Palindrome",
    question: "Given a string, determine whether it reads the same backward as forward, considering only alphanumeric characters and ignoring cases.",
    leetcode: {
      available: true,
      problem_title: "Valid Palindrome",
      url: "https://leetcode.com/problems/valid-palindrome/"
    }
  },
  {
    id: "sE3",
    title: "Count Vowels and Consonants",
    difficulty: "Easy",
    topic: "String",
    pattern: "String Traversal",
    question: "Given a string containing alphabetic characters and spaces, calculate and return the count of vowels and consonants present in the string.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sE4",
    title: "Find the Length of a String Without Using length()",
    difficulty: "Easy",
    topic: "String",
    pattern: "String Traversal",
    question: "Given a string, calculate its total number of characters by iterating through the characters manually without calling any built-in length or size functions.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sE5",
    title: "Convert Lowercase to Uppercase",
    difficulty: "Easy",
    topic: "String",
    pattern: "String Traversal",
    question: "Given a string containing lowercase English alphabets, convert each lowercase character to its corresponding uppercase character using ASCII manipulation.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sE6",
    title: "Remove Spaces from a String",
    difficulty: "Easy",
    topic: "String",
    pattern: "String Traversal",
    question: "Given a string containing spaces between words, modify the string or return a new string with all space characters removed.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sE7",
    title: "Count Frequency of Characters",
    difficulty: "Easy",
    topic: "String",
    pattern: "Frequency Counting",
    question: "Given a string of lowercase characters, determine the occurrence frequency of each distinct character in the order of appearance.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sE8",
    title: "Find First Non-Repeating Character",
    difficulty: "Easy",
    topic: "String",
    pattern: "Hashing",
    question: "Given a string, find the first non-repeating character and return its index. If every character repeats, return -1.",
    leetcode: {
      available: true,
      problem_title: "First Unique Character in a String",
      url: "https://leetcode.com/problems/first-unique-character-in-a-string/"
    }
  },
  {
    id: "sE9",
    title: "Check if Two Strings are Anagrams",
    difficulty: "Easy",
    topic: "String",
    pattern: "Hashing",
    question: "Given two strings s and t, return true if t is an anagram of s, meaning it contains the exact same characters with the same frequencies, and false otherwise.",
    leetcode: {
      available: true,
      problem_title: "Valid Anagram",
      url: "https://leetcode.com/problems/valid-anagram/"
    }
  },
  {
    id: "sE10",
    title: "Remove Duplicate Characters from a String",
    difficulty: "Easy",
    topic: "String",
    pattern: "Frequency Counting",
    question: "Given a string, remove all duplicate characters so that only the first occurrence of each distinct character is retained, preserving original order.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sE11",
    title: "Reverse Words in a String",
    difficulty: "Easy",
    topic: "String",
    pattern: "Two Pointer",
    question: "Given an input string s, reverse the order of the words, removing leading, trailing, and multiple consecutive spaces so words are separated by a single space.",
    leetcode: {
      available: true,
      problem_title: "Reverse Words in a String",
      url: "https://leetcode.com/problems/reverse-words-in-a-string/"
    }
  },
  {
    id: "sE12",
    title: "Check if String Contains Only Digits",
    difficulty: "Easy",
    topic: "String",
    pattern: "String Traversal",
    question: "Given a string, verify whether every character in the string is a valid numeric digit between '0' and '9'.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sE13",
    title: "Find Maximum Occurring Character",
    difficulty: "Easy",
    topic: "String",
    pattern: "Frequency Counting",
    question: "Given a string, find the character that appears the maximum number of times. If multiple characters share the maximum frequency, return the lexicographically smallest one.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sE14",
    title: "Check if One String is a Rotation of Another",
    difficulty: "Easy",
    topic: "String",
    pattern: "String Matching",
    question: "Given two strings s and goal, return true if and only if s can become goal after some number of cyclic shifts.",
    leetcode: {
      available: true,
      problem_title: "Rotate String",
      url: "https://leetcode.com/problems/rotate-string/"
    }
  },
  {
    id: "sE15",
    title: "Valid Palindrome",
    difficulty: "Easy",
    topic: "String",
    pattern: "Two Pointer",
    question: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    leetcode: {
      available: true,
      problem_title: "Valid Palindrome",
      url: "https://leetcode.com/problems/valid-palindrome/"
    }
  }
];

export const mediumStringQuestions = [
  {
    id: "sM1",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: "String",
    pattern: "Sliding Window",
    question: "Given a string s, find the length of the longest substring without repeating characters using dynamic window pointers.",
    leetcode: {
      available: true,
      problem_title: "Longest Substring Without Repeating Characters",
      url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/"
    }
  },
  {
    id: "sM2",
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    topic: "String",
    pattern: "Two Pointer",
    question: "Given a string s, return the longest contiguous palindromic substring in s using center expansion or dynamic programming.",
    leetcode: {
      available: true,
      problem_title: "Longest Palindromic Substring",
      url: "https://leetcode.com/problems/longest-palindromic-substring/"
    }
  },
  {
    id: "sM3",
    title: "Group Anagrams",
    difficulty: "Medium",
    topic: "String",
    pattern: "Sorting",
    question: "Given an array of strings strs, group the anagrams together in any order using sorted key signatures or frequency maps.",
    leetcode: {
      available: true,
      problem_title: "Group Anagrams",
      url: "https://leetcode.com/problems/group-anagrams/"
    }
  },
  {
    id: "sM4",
    title: "String Compression",
    difficulty: "Medium",
    topic: "String",
    pattern: "Two Pointer",
    question: "Given an array of characters chars, compress it using consecutive character counts in-place and return the new length of the array.",
    leetcode: {
      available: true,
      problem_title: "String Compression",
      url: "https://leetcode.com/problems/string-compression/"
    }
  },
  {
    id: "sM5",
    title: "Sort Characters by Frequency",
    difficulty: "Medium",
    topic: "String",
    pattern: "Sorting",
    question: "Given a string s, sort it in decreasing order based on the frequency of the characters and return the resulting string.",
    leetcode: {
      available: true,
      problem_title: "Sort Characters By Frequency",
      url: "https://leetcode.com/problems/sort-characters-by-frequency/"
    }
  },
  {
    id: "sM6",
    title: "Longest Common Prefix",
    difficulty: "Medium",
    topic: "String",
    pattern: "String Traversal",
    question: "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
    leetcode: {
      available: true,
      problem_title: "Longest Common Prefix",
      url: "https://leetcode.com/problems/longest-common-prefix/"
    }
  },
  {
    id: "sM7",
    title: "Implement strStr() / Find Substring",
    difficulty: "Medium",
    topic: "String",
    pattern: "String Matching",
    question: "Given two strings needle and haystack, return the index of the first occurrence of needle in haystack, or -1 if needle is not part of haystack.",
    leetcode: {
      available: true,
      problem_title: "Find the Index of the First Occurrence in a String",
      url: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/"
    }
  },
  {
    id: "sM8",
    title: "Roman to Integer",
    difficulty: "Medium",
    topic: "String",
    pattern: "Parsing",
    question: "Given a roman numeral string, convert it to an integer according to Roman numeral subtraction and addition rules.",
    leetcode: {
      available: true,
      problem_title: "Roman to Integer",
      url: "https://leetcode.com/problems/roman-to-integer/"
    }
  },
  {
    id: "sM9",
    title: "Integer to Roman",
    difficulty: "Medium",
    topic: "String",
    pattern: "Greedy",
    question: "Given an integer, convert it to its standard Roman numeral representation by matching values against standard symbol descending thresholds.",
    leetcode: {
      available: true,
      problem_title: "Integer to Roman",
      url: "https://leetcode.com/problems/integer-to-roman/"
    }
  },
  {
    id: "sM10",
    title: "String to Integer (atoi)",
    difficulty: "Medium",
    topic: "String",
    pattern: "Parsing",
    question: "Implement the myAtoi(string s) function, which converts a string to a 32-bit signed integer handling whitespace, optional sign, and integer clamping limits.",
    leetcode: {
      available: true,
      problem_title: "String to Integer (atoi)",
      url: "https://leetcode.com/problems/string-to-integer-atoi/"
    }
  },
  {
    id: "sM11",
    title: "Count and Say",
    difficulty: "Medium",
    topic: "String",
    pattern: "Recursion",
    question: "The count-and-say sequence is a sequence of digit strings defined by the recursive formula where each term describes the run-length encoding of the previous term.",
    leetcode: {
      available: true,
      problem_title: "Count and Say",
      url: "https://leetcode.com/problems/count-and-say/"
    }
  },
  {
    id: "sM12",
    title: "Decode String",
    difficulty: "Medium",
    topic: "String",
    pattern: "Stack",
    question: "Given an encoded string where k[encoded_string] means the encoded_string inside square brackets is repeated k times, return its decoded string using a stack.",
    leetcode: {
      available: true,
      problem_title: "Decode String",
      url: "https://leetcode.com/problems/decode-string/"
    }
  },
  {
    id: "sM13",
    title: "Minimum Additions to Make Parentheses Valid",
    difficulty: "Medium",
    topic: "String",
    pattern: "Stack",
    question: "A parentheses string is valid if opening and closing brackets match. Return the minimum number of parentheses required to insert into the string to make it valid.",
    leetcode: {
      available: true,
      problem_title: "Minimum Add to Make Parentheses Valid",
      url: "https://leetcode.com/problems/minimum-add-to-make-parentheses-valid/"
    }
  },
  {
    id: "sM14",
    title: "Valid Parentheses",
    difficulty: "Medium",
    topic: "String",
    pattern: "Stack",
    question: "Given a string s containing just '(', ')', '{', '}', '[' and ']', determine if the input string is valid with matched brackets closed in the correct order.",
    leetcode: {
      available: true,
      problem_title: "Valid Parentheses",
      url: "https://leetcode.com/problems/valid-parentheses/"
    }
  },
  {
    id: "sM15",
    title: "Permutation in String",
    difficulty: "Medium",
    topic: "String",
    pattern: "Sliding Window",
    question: "Given two strings s1 and s2, return true if s2 contains a permutation of s1, or false otherwise, using a fixed-size frequency sliding window.",
    leetcode: {
      available: true,
      problem_title: "Permutation in String",
      url: "https://leetcode.com/problems/permutation-in-string/"
    }
  }
];

export const hardStringQuestions = [
  {
    id: "sH1",
    title: "Minimum Window Substring",
    difficulty: "Hard",
    topic: "String",
    pattern: "Sliding Window",
    question: "Given two strings s and t, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.",
    leetcode: {
      available: true,
      problem_title: "Minimum Window Substring",
      url: "https://leetcode.com/problems/minimum-window-substring/"
    }
  },
  {
    id: "sH2",
    title: "Longest Valid Parentheses",
    difficulty: "Hard",
    topic: "String",
    pattern: "Dynamic Programming",
    question: "Given a string containing just '(' and ')', return the length of the longest valid (well-formed) parentheses substring.",
    leetcode: {
      available: true,
      problem_title: "Longest Valid Parentheses",
      url: "https://leetcode.com/problems/longest-valid-parentheses/"
    }
  },
  {
    id: "sH3",
    title: "Regular Expression Matching",
    difficulty: "Hard",
    topic: "String",
    pattern: "Dynamic Programming",
    question: "Given an input string s and a pattern p, implement regular expression matching with support for '.' (any single char) and '*' (zero or more of preceding element).",
    leetcode: {
      available: true,
      problem_title: "Regular Expression Matching",
      url: "https://leetcode.com/problems/regular-expression-matching/"
    }
  },
  {
    id: "sH4",
    title: "Wildcard Matching",
    difficulty: "Hard",
    topic: "String",
    pattern: "Dynamic Programming",
    question: "Given an input string s and a pattern p, implement wildcard pattern matching with support for '?' (matches single char) and '*' (matches any sequence of chars).",
    leetcode: {
      available: true,
      problem_title: "Wildcard Matching",
      url: "https://leetcode.com/problems/wildcard-matching/"
    }
  },
  {
    id: "sH5",
    title: "Edit Distance",
    difficulty: "Hard",
    topic: "String",
    pattern: "Dynamic Programming",
    question: "Given two strings word1 and word2, return the minimum number of operations (insert, delete, replace) required to convert word1 to word2.",
    leetcode: {
      available: true,
      problem_title: "Edit Distance",
      url: "https://leetcode.com/problems/edit-distance/"
    }
  },
  {
    id: "sH6",
    title: "Distinct Subsequences",
    difficulty: "Hard",
    topic: "String",
    pattern: "Dynamic Programming",
    question: "Given two strings s and t, return the number of distinct subsequences of s which equals t.",
    leetcode: {
      available: true,
      problem_title: "Distinct Subsequences",
      url: "https://leetcode.com/problems/distinct-subsequences/"
    }
  },
  {
    id: "sH7",
    title: "Text Justification",
    difficulty: "Hard",
    topic: "String",
    pattern: "Greedy",
    question: "Given an array of strings words and a width maxWidth, format the text such that each line has exactly maxWidth characters and is fully (left and right) justified.",
    leetcode: {
      available: true,
      problem_title: "Text Justification",
      url: "https://leetcode.com/problems/text-justification/"
    }
  },
  {
    id: "sH8",
    title: "Substring with Concatenation of All Words",
    difficulty: "Hard",
    topic: "String",
    pattern: "Sliding Window",
    question: "You are given a string s and an array of strings words of the same length. Find all starting indices of substring(s) in s that is a concatenation of each word in words exactly once.",
    leetcode: {
      available: true,
      problem_title: "Substring with Concatenation of All Words",
      url: "https://leetcode.com/problems/substring-with-concatenation-of-all-words/"
    }
  },
  {
    id: "sH9",
    title: "Palindrome Partitioning II",
    difficulty: "Hard",
    topic: "String",
    pattern: "Dynamic Programming",
    question: "Given a string s, partition s such that every substring of the partition is a palindrome. Return the minimum cuts needed for a palindrome partitioning of s.",
    leetcode: {
      available: true,
      problem_title: "Palindrome Partitioning II",
      url: "https://leetcode.com/problems/palindrome-partitioning-ii/"
    }
  },
  {
    id: "sH10",
    title: "Shortest Palindrome",
    difficulty: "Hard",
    topic: "String",
    pattern: "Prefix/Suffix",
    question: "You are given a string s. You can convert s to a palindrome by adding characters in front of it. Find and return the shortest palindrome you can find by performing this transformation.",
    leetcode: {
      available: true,
      problem_title: "Shortest Palindrome",
      url: "https://leetcode.com/problems/shortest-palindrome/"
    }
  }
];

export const allStringQuestions = [
  ...easyStringQuestions,
  ...mediumStringQuestions,
  ...hardStringQuestions
];

export const allStringPatternsList = [
  "All Patterns",
  "String Traversal",
  "Two Pointer",
  "Hashing",
  "Frequency Counting",
  "Sliding Window",
  "Stack",
  "String Matching",
  "Palindrome",
  "Sorting",
  "Greedy",
  "Dynamic Programming",
  "Prefix/Suffix",
  "Recursion",
  "Parsing"
];
