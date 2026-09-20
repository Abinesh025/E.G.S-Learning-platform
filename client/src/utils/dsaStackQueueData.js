// DSA Stack & Queue Unified Module - Placement Preparation
// Conceptual References: Striver's A2Z DSA Sheet, GeeksforGeeks SDE Sheet, LeetCode Official Problems

export const stackQueueTheory = {
  introduction: {
    title: "Introduction to Stack & Queue",
    content: "Stack and Queue are fundamental linear data structures with sequential access constraints. The key distinction lies in their element removal order: a Stack adheres to the Last-In, First-Out (LIFO) principle, whereas a Queue adheres to the First-In, First-Out (FIFO) principle."
  },

  stack: {
    title: "Stack (LIFO)",
    definition: "A Stack is a linear data structure where elements are inserted and deleted from the same end, designated as the 'top'. It behaves like a physical stack of plates: the last plate placed on top is the first plate removed.",
    core_operations: [
      { operation: "Push(val)", description: "Inserts an element onto the top of the stack.", complexity: "O(1)" },
      { operation: "Pop()", description: "Removes and returns the top element.", complexity: "O(1)" },
      { operation: "Peek() / Top()", description: "Returns the top element without removing it.", complexity: "O(1)" },
      { operation: "isEmpty()", description: "Verifies whether the stack contains zero elements.", complexity: "O(1)" }
    ],
    implementations: [
      "Fixed-size Array (with top index pointer)",
      "Singly Linked List (insert and delete at head for O(1))",
      "Java Stack / ArrayDeque / C++ std::stack"
    ],
    important_concepts: [
      "LIFO (Last In First Out)",
      "Top Pointer Management",
      "Stack Overflow & Underflow Conditions",
      "Monotonic Stack (strictly increasing/decreasing)",
      "Infix, Postfix, Prefix Expression Evaluation",
      "Balanced Parentheses Matching"
    ]
  },

  queue: {
    title: "Queue (FIFO)",
    definition: "A Queue is a linear data structure where elements are inserted at the rear (tail) and deleted from the front (head). It functions like a real-world checkout line: the first customer to arrive is the first customer served.",
    core_operations: [
      { operation: "Enqueue(val)", description: "Adds an element to the rear of the queue.", complexity: "O(1)" },
      { operation: "Dequeue()", description: "Removes and returns the front element.", complexity: "O(1)" },
      { operation: "Front() / Peek()", description: "Inspects the front element without removing it.", complexity: "O(1)" },
      { operation: "Rear()", description: "Returns the last element inserted at the tail.", complexity: "O(1)" },
      { operation: "isEmpty()", description: "Checks whether the queue contains zero elements.", complexity: "O(1)" }
    ],
    implementations: [
      "Linear Array (can lead to memory waste)",
      "Circular Array (modulo arithmetic (rear + 1) % capacity)",
      "Linked List (maintains head and tail pointers for O(1))",
      "Java Queue / ArrayDeque / PriorityQueue / C++ std::queue"
    ],
    important_concepts: [
      "FIFO (First In First Out)",
      "Front and Rear Pointers",
      "Queue Overflow & Underflow",
      "Circular Queue (reusable contiguous slots)",
      "Deque (Double-Ended Queue supporting insert/delete at both ends)",
      "Priority Queue (heap-based retrieval by priority)",
      "Multi-source Breadth-First Search (BFS)",
      "Monotonic Deque (Sliding Window Maximum)"
    ]
  },

  comparison: {
    title: "Stack vs Queue Comparison",
    columns: ["Feature", "Stack", "Queue"],
    rows: [
      { feature: "Principle", stack: "LIFO (Last-In, First-Out)", queue: "FIFO (First-In, First-Out)" },
      { feature: "Insertion Point", stack: "Top end only", queue: "Rear (tail) end" },
      { feature: "Deletion Point", stack: "Top end only", queue: "Front (head) end" },
      { feature: "Primary Pointers", stack: "Single 'top' pointer", queue: "Two pointers: 'front' and 'rear'" },
      { feature: "Core Usage", stack: "Recursion call-stack, undo/redo, expression evaluation, DFS", queue: "Process scheduling, BFS graph traversal, buffering, message queues" }
    ]
  },

  types: {
    stack_types: ["Array-based Stack", "Linked List Stack", "Monotonic Stack"],
    queue_types: ["Simple Linear Queue", "Circular Queue", "Deque (Double-Ended)", "Priority Queue", "Monotonic Deque"]
  },

  complexity: {
    title: "Time & Space Complexity",
    stack: {
      Push: "O(1)",
      Pop: "O(1)",
      Peek: "O(1)",
      Search: "O(n)",
      Space: "O(n)"
    },
    queue: {
      Enqueue: "O(1)",
      Dequeue: "O(1)",
      Front: "O(1)",
      Rear: "O(1)",
      Search: "O(n)",
      Space: "O(n)"
    }
  },

  applications: {
    stack: [
      "Function call management & compiler execution stack",
      "Undo and Redo operations in editors",
      "Browser navigation back-button history",
      "Arithmetic expression conversion (Infix to Postfix/Prefix)",
      "Syntax validation & parentheses matching",
      "Backtracking algorithms (Maze solving, N-Queens)"
    ],
    queue: [
      "CPU process scheduling & round-robin dispatching",
      "Printer spooling and print queue management",
      "Breadth-First Search (BFS) in trees and graphs",
      "Asynchronous message brokering (Kafka, RabbitMQ)",
      "Data buffers (IO buffers, video streaming buffers)",
      "Sliding window optimization using Deque"
    ]
  },

  advantages: {
    stack: [
      "Simple, fast constant-time O(1) operations",
      "Automatic memory cleanup through stack-frame unwinding",
      "Naturally suited for nested structures and reversal problems"
    ],
    queue: [
      "Guarantees fair, first-come first-served processing",
      "Constant-time O(1) insertion and deletion with circular array/linked list",
      "Decouples data producers and consumers in streaming architectures"
    ]
  },

  limitations: {
    stack: [
      "Restricted random access: internal elements cannot be accessed without popping",
      "Fixed-size array implementations risk Stack Overflow",
      "Searching requires linear O(n) traversal"
    ],
    queue: [
      "Restricted random access: middle elements cannot be directly queried",
      "Naive linear array implementations waste memory space before front",
      "Searching requires linear O(n) traversal"
    ]
  }
};

export const stackQueueQuestions = [
  {
    id: "sq1",
    title: "Implement Stack Using Array",
    difficulty: "Easy",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Stack Simulation",
    priority: "High",
    question: "Implement a LIFO stack data structure using a fixed-size array supporting push, pop, peek (top), and isEmpty operations with O(1) time complexity.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sq2",
    title: "Implement Queue Using Array",
    difficulty: "Easy",
    topic: "Stack & Queue",
    category: "Queue",
    pattern: "Queue Simulation",
    priority: "High",
    question: "Implement a FIFO queue data structure using an array with enqueue, dequeue, front, and isEmpty operations, managing front and rear indices.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sq3",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Parentheses Matching",
    priority: "High",
    question: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine whether the input string is valid with matched brackets closed in the correct order.",
    leetcode: {
      available: true,
      problem_title: "Valid Parentheses",
      url: "https://leetcode.com/problems/valid-parentheses/"
    }
  },
  {
    id: "sq4",
    title: "Reverse a String Using Stack",
    difficulty: "Easy",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Stack Simulation",
    priority: "High",
    question: "Given a string, utilize the LIFO properties of a stack to push all characters and then pop them sequentially to construct the reversed string.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  },
  {
    id: "sq5",
    title: "Implement Stack Using Queues",
    difficulty: "Easy",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Queue Simulation",
    priority: "High",
    question: "Implement a last-in-first-out (LIFO) stack using only standard FIFO queue operations (enqueue, dequeue, peek, and isEmpty).",
    leetcode: {
      available: true,
      problem_title: "Implement Stack using Queues",
      url: "https://leetcode.com/problems/implement-stack-using-queues/"
    }
  },
  {
    id: "sq6",
    title: "Implement Queue Using Stacks",
    difficulty: "Easy",
    topic: "Stack & Queue",
    category: "Queue",
    pattern: "Stack Simulation",
    priority: "High",
    question: "Implement a first-in-first-out (FIFO) queue using only two LIFO stacks supporting push, pop, peek, and empty operations.",
    leetcode: {
      available: true,
      problem_title: "Implement Queue using Stacks",
      url: "https://leetcode.com/problems/implement-queue-using-stacks/"
    }
  },
  {
    id: "sq7",
    title: "Evaluate Reverse Polish Notation",
    difficulty: "Medium",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Expression Evaluation",
    priority: "High",
    question: "Evaluate the value of an arithmetic expression given in Reverse Polish Notation (postfix) containing operators '+', '-', '*', and '/' using an operand stack.",
    leetcode: {
      available: true,
      problem_title: "Evaluate Reverse Polish Notation",
      url: "https://leetcode.com/problems/evaluate-reverse-polish-notation/"
    }
  },
  {
    id: "sq8",
    title: "Min Stack",
    difficulty: "Medium",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Stack Simulation",
    priority: "High",
    question: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant O(1) time complexity.",
    leetcode: {
      available: true,
      problem_title: "Min Stack",
      url: "https://leetcode.com/problems/min-stack/"
    }
  },
  {
    id: "sq9",
    title: "Next Greater Element I",
    difficulty: "Easy",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Monotonic Stack",
    priority: "High",
    question: "The next greater element of an element x in an array is the first greater element to the right of x. Find the next greater element for each query value using a monotonic stack.",
    leetcode: {
      available: true,
      problem_title: "Next Greater Element I",
      url: "https://leetcode.com/problems/next-greater-element-i/"
    }
  },
  {
    id: "sq10",
    title: "Daily Temperatures",
    difficulty: "Medium",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Monotonic Stack",
    priority: "High",
    question: "Given an array of integers temperatures representing daily temperatures, return an array such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature.",
    leetcode: {
      available: true,
      problem_title: "Daily Temperatures",
      url: "https://leetcode.com/problems/daily-temperatures/"
    }
  },
  {
    id: "sq11",
    title: "Next Greater Element II",
    difficulty: "Medium",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Monotonic Stack",
    priority: "High",
    question: "Given a circular integer array nums, return the next greater number for every element by simulating circular traversal with modulo arithmetic on a monotonic stack.",
    leetcode: {
      available: true,
      problem_title: "Next Greater Element II",
      url: "https://leetcode.com/problems/next-greater-element-ii/"
    }
  },
  {
    id: "sq12",
    title: "Asteroid Collision",
    difficulty: "Medium",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Stack Simulation",
    priority: "High",
    question: "We are given an array asteroids of integers representing asteroids in a row. For each asteroid, the absolute value represents its size, and the sign represents its direction. Determine the state of the asteroids after all collisions.",
    leetcode: {
      available: true,
      problem_title: "Asteroid Collision",
      url: "https://leetcode.com/problems/asteroid-collision/"
    }
  },
  {
    id: "sq13",
    title: "Sliding Window Maximum",
    difficulty: "Hard",
    topic: "Stack & Queue",
    category: "Queue",
    pattern: "Monotonic Queue",
    priority: "High",
    question: "You are given an array of integers nums and a sliding window of size k moving from left to right. Return the max sliding window values using a monotonic double-ended queue (deque).",
    leetcode: {
      available: true,
      problem_title: "Sliding Window Maximum",
      url: "https://leetcode.com/problems/sliding-window-maximum/"
    }
  },
  {
    id: "sq14",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Monotonic Stack",
    priority: "High",
    question: "Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram using a monotonic stack.",
    leetcode: {
      available: true,
      problem_title: "Largest Rectangle in Histogram",
      url: "https://leetcode.com/problems/largest-rectangle-in-histogram/"
    }
  },
  {
    id: "sq15",
    title: "Longest Valid Parentheses",
    difficulty: "Hard",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Parentheses Matching",
    priority: "High",
    question: "Given a string containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring using a stack storing indices.",
    leetcode: {
      available: true,
      problem_title: "Longest Valid Parentheses",
      url: "https://leetcode.com/problems/longest-valid-parentheses/"
    }
  },
  {
    id: "sq16",
    title: "Number of Recent Calls",
    difficulty: "Easy",
    topic: "Stack & Queue",
    category: "Queue",
    pattern: "Queue Simulation",
    priority: "Medium",
    question: "You have a RecentCounter class which counts the number of recent requests within a certain time frame [t - 3000, t] using a FIFO queue.",
    leetcode: {
      available: true,
      problem_title: "Number of Recent Calls",
      url: "https://leetcode.com/problems/number-of-recent-calls/"
    }
  },
  {
    id: "sq17",
    title: "Design Circular Queue",
    difficulty: "Medium",
    topic: "Stack & Queue",
    category: "Queue",
    pattern: "Circular Queue",
    priority: "High",
    question: "Design your implementation of the circular queue supporting enQueue, deQueue, Front, Rear, isEmpty, and isFull operations using fixed-size array and modulo index arithmetic.",
    leetcode: {
      available: true,
      problem_title: "Design Circular Queue",
      url: "https://leetcode.com/problems/design-circular-queue/"
    }
  },
  {
    id: "sq18",
    title: "Rotting Oranges",
    difficulty: "Medium",
    topic: "Stack & Queue",
    category: "Queue",
    pattern: "BFS",
    priority: "High",
    question: "You are given an m x n grid where each cell has fresh, rotten, or no oranges. Return the minimum number of minutes that must elapse until no cell has a fresh orange, using multi-source BFS with a queue.",
    leetcode: {
      available: true,
      problem_title: "Rotting Oranges",
      url: "https://leetcode.com/problems/rotting-oranges/"
    }
  },
  {
    id: "sq19",
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    topic: "Stack & Queue",
    category: "Queue",
    pattern: "BFS",
    priority: "High",
    question: "Given the root of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level) using a FIFO queue.",
    leetcode: {
      available: true,
      problem_title: "Binary Tree Level Order Traversal",
      url: "https://leetcode.com/problems/binary-tree-level-order-traversal/"
    }
  },
  {
    id: "sq20",
    title: "Evaluate Postfix Expression",
    difficulty: "Medium",
    topic: "Stack & Queue",
    category: "Stack",
    pattern: "Expression Evaluation",
    priority: "High",
    question: "Given a postfix arithmetic expression string, evaluate and calculate its final numeric result by pushing operands to a stack and popping two values when an operator is encountered.",
    leetcode: {
      available: false,
      problem_title: null,
      url: null
    }
  }
];

export const allStackQueueQuestions = [...stackQueueQuestions];

export const allStackQueuePatternsList = [
  "All Patterns",
  "Stack Simulation",
  "Queue Simulation",
  "Parentheses Matching",
  "Expression Evaluation",
  "Monotonic Stack",
  "Monotonic Queue",
  "Circular Queue",
  "BFS"
];

export const stackQueueCategoriesList = ["All", "Stack", "Queue"];
