// DSA Linked List Coding Questions Bank - Placement Preparation
// Conceptual References: Striver's A2Z DSA Sheet, GeeksforGeeks SDE Sheet, LeetCode Official Problems

export const easyLinkedListQuestions = [
  {
    id: "llE1",
    title: "Implement a Singly Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Insertion",
    question: "Design and implement a basic singly linked list with methods to initialize nodes, append values, and display the elements in sequential order.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llE2",
    title: "Traverse a Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Linked List Traversal",
    question: "Given the head of a singly linked list, traverse the list iteratively from head to tail and print each node's value.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llE3",
    title: "Insert a Node at Beginning",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Insertion",
    question: "Given the head of a linked list and an integer val, insert a new node with value val at the very beginning of the list and return the new head.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llE4",
    title: "Insert a Node at End",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Insertion",
    question: "Given the head of a singly linked list and an integer val, traverse to the end of the list and append a new node with value val.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llE5",
    title: "Insert a Node at a Given Position",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Insertion",
    question: "Given the head of a singly linked list, an integer pos (1-based), and an integer val, insert a new node containing val at position pos.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llE6",
    title: "Delete a Node from Beginning",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Deletion",
    question: "Given the head of a non-empty singly linked list, delete the first node (head) and return the head of the updated list.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llE7",
    title: "Delete a Node from End",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Deletion",
    question: "Given the head of a singly linked list, delete the last node of the list and update the second-to-last node's next pointer to null.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llE8",
    title: "Delete a Node at a Given Position",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Deletion",
    question: "There is a singly-linked list and we want to delete a node in it. You are given only access to the node to be deleted directly (not the head node).",
    leetcode: {
      available: true,
      problem_title: "Delete Node in a Linked List",
      url: "https://leetcode.com/problems/delete-node-in-a-linked-list/"
    }
  },
  {
    id: "llE9",
    title: "Search for an Element in Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Linked List Traversal",
    question: "Given the head of a singly linked list and an integer key, determine whether the key is present in any node of the linked list.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llE10",
    title: "Find Length of Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Linked List Traversal",
    question: "Given the head of a singly linked list, count and return the total number of nodes present in the list.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llE11",
    title: "Reverse a Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Reversal",
    question: "Given the head of a singly linked list, reverse the list iteratively or recursively, and return the reversed list's new head.",
    leetcode: {
      available: true,
      problem_title: "Reverse Linked List",
      url: "https://leetcode.com/problems/reverse-linked-list/"
    }
  },
  {
    id: "llE12",
    title: "Find Middle of Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Fast and Slow Pointer",
    question: "Given the head of a singly linked list, return the middle node of the linked list using the two-pointer (tortoise and hare) technique.",
    leetcode: {
      available: true,
      problem_title: "Middle of the Linked List",
      url: "https://leetcode.com/problems/middle-of-the-linked-list/"
    }
  },
  {
    id: "llE13",
    title: "Detect Loop in Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Cycle Detection",
    question: "Given head, the head of a linked list, determine if the linked list has a cycle in it using Floyd's cycle-finding algorithm.",
    leetcode: {
      available: true,
      problem_title: "Linked List Cycle",
      url: "https://leetcode.com/problems/linked-list-cycle/"
    }
  },
  {
    id: "llE14",
    title: "Remove Duplicates from Sorted Linked List",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "In-place Manipulation",
    question: "Given the head of a sorted linked list, delete all duplicates such that each element appears only once, returning the linked list sorted as well.",
    leetcode: {
      available: true,
      problem_title: "Remove Duplicates from Sorted List",
      url: "https://leetcode.com/problems/remove-duplicates-from-sorted-list/"
    }
  },
  {
    id: "llE15",
    title: "Merge Two Sorted Linked Lists",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "Merge",
    question: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list by splicing together their nodes.",
    leetcode: {
      available: true,
      problem_title: "Merge Two Sorted Lists",
      url: "https://leetcode.com/problems/merge-two-sorted-lists/"
    }
  }
];

export const mediumLinkedListQuestions = [
  {
    id: "llM1",
    title: "Add Two Numbers Represented by Linked Lists",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Linked List Traversal",
    question: "You are given two non-empty linked lists representing two non-negative integers stored in reverse order. Add the two numbers and return the sum as a linked list.",
    leetcode: {
      available: true,
      problem_title: "Add Two Numbers",
      url: "https://leetcode.com/problems/add-two-numbers/"
    }
  },
  {
    id: "llM2",
    title: "Remove Nth Node From End of List",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Two Pointer",
    question: "Given the head of a linked list, remove the nth node from the end of the list and return its head in one pass using two pointers.",
    leetcode: {
      available: true,
      problem_title: "Remove Nth Node From End of List",
      url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/"
    }
  },
  {
    id: "llM3",
    title: "Delete the Middle Node of a Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Fast and Slow Pointer",
    question: "You are given the head of a linked list. Delete the middle node, and return the head of the modified linked list using fast and slow pointers.",
    leetcode: {
      available: true,
      problem_title: "Delete the Middle Node of a Linked List",
      url: "https://leetcode.com/problems/delete-the-middle-node-of-a-linked-list/"
    }
  },
  {
    id: "llM4",
    title: "Odd Even Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Multiple Pointers",
    question: "Given the head of a singly linked list, group all the nodes with odd indices together followed by the nodes with even indices, and return the reordered list.",
    leetcode: {
      available: true,
      problem_title: "Odd Even Linked List",
      url: "https://leetcode.com/problems/odd-even-linked-list/"
    }
  },
  {
    id: "llM5",
    title: "Palindrome Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Fast and Slow Pointer",
    question: "Given the head of a singly linked list, return true if it is a palindrome or false otherwise by finding the middle, reversing the second half, and comparing.",
    leetcode: {
      available: true,
      problem_title: "Palindrome Linked List",
      url: "https://leetcode.com/problems/palindrome-linked-list/"
    }
  },
  {
    id: "llM6",
    title: "Intersection of Two Linked Lists",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Two Pointer",
    question: "Given the heads of two singly linked-lists headA and headB, return the node at which the two lists intersect, or null if they do not intersect.",
    leetcode: {
      available: true,
      problem_title: "Intersection of Two Linked Lists",
      url: "https://leetcode.com/problems/intersection-of-two-linked-lists/"
    }
  },
  {
    id: "llM7",
    title: "Sort a Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Sorting",
    question: "Given the head of a linked list, return the list after sorting it in ascending order in O(n log n) time using merge sort.",
    leetcode: {
      available: true,
      problem_title: "Sort List",
      url: "https://leetcode.com/problems/sort-list/"
    }
  },
  {
    id: "llM8",
    title: "Remove Duplicates from Unsorted Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Hashing",
    question: "Given the head of an unsorted linked list, remove duplicate elements while keeping only the first occurrence of each value using a hash set.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llM9",
    title: "Rotate List",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Two Pointer",
    question: "Given the head of a linked list, rotate the list to the right by k places by connecting the tail to the head into a ring and breaking at (len - k % len).",
    leetcode: {
      available: true,
      problem_title: "Rotate List",
      url: "https://leetcode.com/problems/rotate-list/"
    }
  },
  {
    id: "llM10",
    title: "Swap Nodes in Pairs",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Multiple Pointers",
    question: "Given a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list's nodes.",
    leetcode: {
      available: true,
      problem_title: "Swap Nodes in Pairs",
      url: "https://leetcode.com/problems/swap-nodes-in-pairs/"
    }
  },
  {
    id: "llM11",
    title: "Reverse Linked List in Groups",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Reversal",
    question: "Given a linked list, reverse the nodes of the list k at a time and return its modified list. If number of nodes is not a multiple of k, left-out nodes remain as-is.",
    leetcode: {
      available: true,
      problem_title: "Reverse Nodes in k-Group",
      url: "https://leetcode.com/problems/reverse-nodes-in-k-group/"
    }
  },
  {
    id: "llM12",
    title: "Reorder List",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Fast and Slow Pointer",
    question: "You are given the head of a singly linked-list: L0 -> L1 -> ... -> Ln - 1 -> Ln. Reorder the list to be: L0 -> Ln -> L1 -> Ln - 1 -> L2 -> Ln - 2 -> ...",
    leetcode: {
      available: true,
      problem_title: "Reorder List",
      url: "https://leetcode.com/problems/reorder-list/"
    }
  },
  {
    id: "llM13",
    title: "Flatten a Linked List",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Merge",
    question: "Given a linked list where every node represents a sub-linked-list and contains two pointers: 'next' and 'bottom', flatten the entire data structure into a single sorted list.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llM14",
    title: "Find the Starting Point of a Cycle",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Cycle Detection",
    question: "Given the head of a linked list, return the node where the cycle begins using Floyd's cycle detection and distance equality. If there is no cycle, return null.",
    leetcode: {
      available: true,
      problem_title: "Linked List Cycle II",
      url: "https://leetcode.com/problems/linked-list-cycle-ii/"
    }
  },
  {
    id: "llM15",
    title: "Partition List",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "Dummy Node",
    question: "Given the head of a linked list and a value x, partition it such that all nodes less than x come before nodes greater than or equal to x while preserving relative order.",
    leetcode: {
      available: true,
      problem_title: "Partition List",
      url: "https://leetcode.com/problems/partition-list/"
    }
  }
];

export const hardLinkedListQuestions = [
  {
    id: "llH1",
    title: "Reverse Nodes in K Group",
    difficulty: "Hard",
    topic: "Linked List",
    pattern: "Reversal",
    question: "Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list. Nodes remaining at the end (fewer than k) stay in their original order.",
    leetcode: {
      available: true,
      problem_title: "Reverse Nodes in k-Group",
      url: "https://leetcode.com/problems/reverse-nodes-in-k-group/"
    }
  },
  {
    id: "llH2",
    title: "Merge K Sorted Linked Lists",
    difficulty: "Hard",
    topic: "Linked List",
    pattern: "Merge",
    question: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    leetcode: {
      available: true,
      problem_title: "Merge k Sorted Lists",
      url: "https://leetcode.com/problems/merge-k-sorted-lists/"
    }
  },
  {
    id: "llH3",
    title: "Copy List with Random Pointer",
    difficulty: "Hard",
    topic: "Linked List",
    pattern: "Hashing",
    question: "A linked list of length n is given such that each node contains an additional random pointer. Construct a deep copy of the list.",
    leetcode: {
      available: true,
      problem_title: "Copy List with Random Pointer",
      url: "https://leetcode.com/problems/copy-list-with-random-pointer/"
    }
  },
  {
    id: "llH4",
    title: "LRU Cache Using Linked List and HashMap",
    difficulty: "Hard",
    topic: "Linked List",
    pattern: "Multiple Pointers",
    question: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache using a Doubly Linked List and a Hash Map for O(1) operations.",
    leetcode: {
      available: true,
      problem_title: "LRU Cache",
      url: "https://leetcode.com/problems/lru-cache/"
    }
  },
  {
    id: "llH5",
    title: "Design a Doubly Linked List",
    difficulty: "Hard",
    topic: "Linked List",
    pattern: "Multiple Pointers",
    question: "Design your implementation of the linked list with previous and next node links supporting get, addAtHead, addAtTail, addAtIndex, and deleteAtIndex.",
    leetcode: {
      available: true,
      problem_title: "Design Linked List",
      url: "https://leetcode.com/problems/design-linked-list/"
    }
  },
  {
    id: "llH6",
    title: "Flatten a Multilevel Doubly Linked List",
    difficulty: "Hard",
    topic: "Linked List",
    pattern: "Linked List Traversal",
    question: "You are given a doubly linked list where each node may have a child doubly linked list. Flatten the list so that all nodes appear in a single-level doubly linked list.",
    leetcode: {
      available: true,
      problem_title: "Flatten a Multilevel Doubly Linked List",
      url: "https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/"
    }
  },
  {
    id: "llH7",
    title: "Sort a Linked List Using Merge Sort",
    difficulty: "Hard",
    topic: "Linked List",
    pattern: "Sorting",
    question: "Given the head of a linked list, implement top-down or bottom-up merge sort to sort the linked list in O(n log n) time complexity.",
    leetcode: {
      available: true,
      problem_title: "Sort List",
      url: "https://leetcode.com/problems/sort-list/"
    }
  },
  {
    id: "llH8",
    title: "Reverse a Doubly Linked List",
    difficulty: "Hard",
    topic: "Linked List",
    pattern: "Reversal",
    question: "Given a doubly linked list, write a function to reverse the list by swapping next and prev pointers for every node and returning the new head.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llH9",
    title: "Detect and Remove Loop in Linked List",
    difficulty: "Hard",
    topic: "Linked List",
    pattern: "Cycle Detection",
    question: "Given a linked list that may contain a cycle, detect the cycle using Floyd's algorithm, find the starting node of the loop, and remove the cycle by setting next to null.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "llH10",
    title: "Clone a Linked List with Random Pointer",
    difficulty: "Hard",
    topic: "Linked List",
    pattern: "Hashing",
    question: "Clone an arbitrary linked list with next and random pointer in O(1) extra space by interweaving cloned nodes with original nodes.",
    leetcode: {
      available: true,
      problem_title: "Copy List with Random Pointer",
      url: "https://leetcode.com/problems/copy-list-with-random-pointer/"
    }
  }
];

export const allLinkedListQuestions = [
  ...easyLinkedListQuestions,
  ...mediumLinkedListQuestions,
  ...hardLinkedListQuestions
];

export const allLinkedListPatternsList = [
  "All Patterns",
  "Linked List Traversal",
  "Insertion",
  "Deletion",
  "Two Pointer",
  "Fast and Slow Pointer",
  "Hashing",
  "Recursion",
  "Reversal",
  "Merge",
  "Sorting",
  "Cycle Detection",
  "In-place Manipulation",
  "Dummy Node",
  "Multiple Pointers"
];
