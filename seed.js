import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Problem from './src/models/Problem.js';
import User from './src/models/User.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB');

// ── Seed Admin User ───────────────────────────
const adminExists = await User.findOne({ email: 'admin@codeforge.com' });
if (!adminExists) {
  const hash = await bcrypt.hash('admin123', 12);
  await new User({
    name: 'Admin', email: 'admin@codeforge.com',
    passwordHash: hash, isAdmin: true, plan: 'pro',
    ratingTitle: 'Admin', oauthProvider: 'admin',
  }).save();
  console.log('✅ Admin user created: admin@codeforge.com / admin123');
}

// ── Problems ──────────────────────────────────
await Problem.deleteMany({});

const problems = [
  {
    number: 1, title: 'Two Sum', difficulty: 'Easy',
    tags: ['Array', 'Hash Table'], companies: ['Google', 'Amazon', 'Apple'],
    acceptance: 49.2, premium: false,
    description: `Given an array of integers <code>nums</code> and an integer <code>target</code>, return <strong>indices</strong> of the two numbers such that they add up to target.<br><br>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Only one valid answer exists'],
    testCases: [
      { input: '[2,7,11,15]\n9', expected: '[0,1]' },
      { input: '[3,2,4]\n6', expected: '[1,2]' },
      { input: '[3,3]\n6', expected: '[0,1]' },
    ],
    hints: ['Try using a hash map to store visited numbers.', 'For each number, check if target - num exists in the map.', 'Return indices immediately when complement is found.'],
    starter: {
      python: 'class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n    }\n};',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return null;\n    }\n}',
      javascript: 'var twoSum = function(nums, target) {\n};',
    },
    aiContext: 'Two Sum — find two indices that sum to target, classic hash map O(n) solution',
  },
  {
    number: 2, title: 'Valid Parentheses', difficulty: 'Easy',
    tags: ['String', 'Stack'], companies: ['Google', 'Facebook', 'Amazon'],
    acceptance: 40.6, premium: false,
    description: `Given a string <code>s</code> containing just <code>(</code>, <code>)</code>, <code>{</code>, <code>}</code>, <code>[</code> and <code>]</code>, determine if the input string is valid.`,
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of parentheses only'],
    testCases: [
      { input: '()', expected: 'true' },
      { input: '()[]{} ', expected: 'true' },
      { input: '(]', expected: 'false' },
    ],
    hints: ['Use a stack data structure.', 'Push opening brackets, pop on closing brackets.', 'Stack must be empty at the end.'],
    starter: {
      python: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        pass',
      cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n    }\n};',
      java: 'class Solution {\n    public boolean isValid(String s) {\n    }\n}',
      javascript: 'var isValid = function(s) {\n};',
    },
    aiContext: 'Valid Parentheses — stack-based bracket matching',
  },
  {
    number: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Sliding Window'], companies: ['Google', 'Amazon', 'Facebook', 'Microsoft'],
    acceptance: 33.8, premium: false,
    description: `Given a string <code>s</code>, find the length of the <strong>longest substring</strong> without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: '"abc" has length 3' },
      { input: 's = "bbbbb"', output: '1' },
      { input: 's = "pwwkew"', output: '3', explanation: '"wke" has length 3' },
    ],
    constraints: ['0 ≤ s.length ≤ 5×10⁴'],
    testCases: [
      { input: 'abcabcbb', expected: '3' },
      { input: 'bbbbb', expected: '1' },
      { input: 'pwwkew', expected: '3' },
    ],
    hints: ['Use sliding window with two pointers.', 'Track chars in current window with a set.', 'Shrink window from left when duplicate found.'],
    starter: {
      python: 'class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass',
      cpp: 'class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n    }\n};',
      java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n    }\n}',
      javascript: 'var lengthOfLongestSubstring = function(s) {\n};',
    },
    aiContext: 'Longest Substring Without Repeating Characters — sliding window O(n)',
  },
  {
    number: 4, title: 'Maximum Subarray', difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'], companies: ['Amazon', 'Apple', 'LinkedIn'],
    acceptance: 49.5, premium: false,
    description: `Given an integer array <code>nums</code>, find the subarray with the largest sum, and return its sum.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has sum 6' },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    testCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', expected: '6' },
      { input: '1', expected: '1' },
      { input: '5 4 -1 7 8', expected: '23' },
    ],
    hints: ["Kadane's algorithm runs in O(n).", 'Keep a running sum, reset to 0 when negative.', 'Track the maximum seen so far.'],
    starter: {
      python: 'class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        pass',
      cpp: 'class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n    }\n};',
      java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n    }\n}',
      javascript: 'var maxSubArray = function(nums) {\n};',
    },
    aiContext: "Maximum Subarray — Kadane's algorithm O(n)",
  },
  {
    number: 5, title: 'Binary Search', difficulty: 'Easy',
    tags: ['Array', 'Binary Search'], companies: ['Microsoft', 'Google'],
    acceptance: 55.3, premium: false,
    description: `Given a sorted array of integers <code>nums</code> and integer <code>target</code>, return the index if found, else return <code>-1</code>.`,
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁴', 'All values are unique', 'nums is sorted ascending'],
    testCases: [
      { input: '-1 0 3 5 9 12\n9', expected: '4' },
      { input: '-1 0 3 5 9 12\n2', expected: '-1' },
    ],
    hints: ['Maintain lo and hi pointers.', 'Compute mid = (lo + hi) // 2.', 'Move lo or hi based on comparison.'],
    starter: {
      python: 'class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass',
      cpp: 'class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n    }\n};',
      java: 'class Solution {\n    public int search(int[] nums, int target) {\n    }\n}',
      javascript: 'var search = function(nums, target) {\n};',
    },
    aiContext: 'Binary Search — classic lo/hi pointer O(log n)',
  },
  {
    number: 6, title: 'Merge Intervals', difficulty: 'Medium',
    tags: ['Array', 'Sorting'], companies: ['Facebook', 'Google', 'Twitter'],
    acceptance: 45.8, premium: false,
    description: `Given an array of intervals, merge all overlapping intervals and return the result.`,
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]' },
    ],
    constraints: ['1 ≤ intervals.length ≤ 10⁴'],
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expected: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', expected: '[[1,5]]' },
    ],
    hints: ['Sort intervals by start time.', 'Compare each with the last merged interval.', 'Merge if overlap, otherwise append.'],
    starter: {
      python: 'class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        pass',
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n    }\n};',
      java: 'class Solution {\n    public int[][] merge(int[][] intervals) {\n    }\n}',
      javascript: 'var merge = function(intervals) {\n};',
    },
    aiContext: 'Merge Intervals — sort then linear scan O(n log n)',
  },
  {
    number: 7, title: 'Coin Change', difficulty: 'Medium',
    tags: ['Dynamic Programming', 'BFS'], companies: ['Amazon', 'Google', 'Microsoft'],
    acceptance: 41.3, premium: false,
    description: `Given coins of different denominations and a total amount, return the fewest coins needed. Return <code>-1</code> if not possible.`,
    examples: [
      { input: 'coins = [1,5,10,25], amount = 41', output: '4', explanation: '25+10+5+1' },
      { input: 'coins = [2], amount = 3', output: '-1' },
      { input: 'coins = [1], amount = 0', output: '0' },
    ],
    constraints: ['1 ≤ coins.length ≤ 12', '0 ≤ amount ≤ 10⁴'],
    testCases: [
      { input: '[1,5,10,25]\n41', expected: '4' },
      { input: '[2]\n3', expected: '-1' },
      { input: '[1]\n0', expected: '0' },
    ],
    hints: ['Define dp[i] = min coins for amount i.', 'Initialize dp[0]=0, rest=infinity.', 'dp[i] = min(dp[i], dp[i-coin]+1) for each coin.'],
    starter: {
      python: 'class Solution:\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        pass',
      cpp: 'class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n    }\n};',
      java: 'class Solution {\n    public int coinChange(int[] coins, int amount) {\n    }\n}',
      javascript: 'var coinChange = function(coins, amount) {\n};',
    },
    aiContext: 'Coin Change — bottom-up DP O(n*amount)',
  },
  {
    number: 8, title: 'Median of Two Sorted Arrays', difficulty: 'Hard',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    companies: ['Google', 'Amazon', 'Goldman Sachs'], acceptance: 36.2, premium: true,
    description: `Given two sorted arrays, return the median. The solution must run in <code>O(log(m+n))</code>.`,
    examples: [
      { input: 'nums1 = [1,3], nums2 = [2]', output: '2.00000' },
      { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.50000' },
    ],
    constraints: ['0 ≤ m,n ≤ 1000', '1 ≤ m+n ≤ 2000'],
    testCases: [
      { input: '[1,3]\n[2]', expected: '2.00000' },
      { input: '[1,2]\n[3,4]', expected: '2.50000' },
    ],
    hints: ['Binary search on the shorter array.', 'Find the correct partition.', 'Ensure max(left) ≤ min(right).'],
    starter: {
      python: 'class Solution:\n    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:\n        pass',
      cpp: 'class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n    }\n};',
      java: 'class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n    }\n}',
      javascript: 'var findMedianSortedArrays = function(nums1, nums2) {\n};',
    },
    aiContext: 'Median of Two Sorted Arrays — binary search partition O(log(min(m,n)))',
  },
  {
    number: 9, title: 'LRU Cache', difficulty: 'Medium',
    tags: ['Hash Table', 'Linked List', 'Design'],
    companies: ['Google', 'Amazon', 'Microsoft', 'Facebook'], acceptance: 42.1, premium: false,
    description: `Design an LRU cache supporting <code>get(key)</code> and <code>put(key, value)</code> in <code>O(1)</code>.`,
    examples: [
      { input: 'LRUCache(2), put(1,1), put(2,2), get(1)→1, put(3,3), get(2)→-1', output: '[null,null,null,1,null,-1]' },
    ],
    constraints: ['1 ≤ capacity ≤ 3000'],
    testCases: [{ input: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2', expected: '1\n-1' }],
    hints: ['Use OrderedDict in Python or LinkedHashMap in Java.', 'On get: move key to end.', 'On put: if full, evict the front.'],
    starter: {
      python: 'class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass',
      cpp: 'class LRUCache {\npublic:\n    LRUCache(int capacity) {}\n    int get(int key) { return -1; }\n    void put(int key, int value) {}\n};',
      java: 'class LRUCache {\n    public LRUCache(int capacity) {}\n    public int get(int key) { return -1; }\n    public void put(int key, int value) {}\n}',
      javascript: 'class LRUCache {\n    constructor(capacity) {}\n    get(key) {}\n    put(key, value) {}\n}',
    },
    aiContext: 'LRU Cache — OrderedDict or doubly linked list + hash map O(1)',
  },
  {
    number: 10, title: 'Course Schedule', difficulty: 'Medium',
    tags: ['Graph', 'Topological Sort', 'DFS', 'BFS'],
    companies: ['Facebook', 'Amazon', 'Uber'], acceptance: 45.3, premium: false,
    description: `Return <code>true</code> if you can finish all numCourses given prerequisites.`,
    examples: [
      { input: 'numCourses=2, prerequisites=[[1,0]]', output: 'true' },
      { input: 'numCourses=2, prerequisites=[[1,0],[0,1]]', output: 'false', explanation: 'Cycle detected' },
    ],
    constraints: ['1 ≤ numCourses ≤ 2000'],
    testCases: [
      { input: '2\n[[1,0]]', expected: 'true' },
      { input: '2\n[[1,0],[0,1]]', expected: 'false' },
    ],
    hints: ['Build an adjacency list.', 'DFS to detect cycles.', 'Track visit states: 0=unvisited, 1=visiting, 2=done.'],
    starter: {
      python: 'class Solution:\n    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:\n        pass',
      cpp: 'class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n    }\n};',
      java: 'class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n    }\n}',
      javascript: 'var canFinish = function(numCourses, prerequisites) {\n};',
    },
    aiContext: 'Course Schedule — cycle detection in directed graph via DFS/Kahn',
  },
  {
    number: 11, title: 'Word Search', difficulty: 'Medium',
    tags: ['Array', 'Backtracking', 'Matrix'],
    companies: ['Facebook', 'Amazon'], acceptance: 39.7, premium: false,
    description: `Given an m×n grid, return <code>true</code> if the word exists using adjacent cells.`,
    examples: [
      { input: 'board=[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word="ABCCED"', output: 'true' },
    ],
    constraints: ['1 ≤ m, n ≤ 6', 'word.length ≤ 15'],
    testCases: [{ input: 'ABCE/SFCS/ADEE\nABCCED', expected: 'true' }],
    hints: ['DFS from every cell.', 'Mark visited cells temporarily.', 'Restore cell on backtrack.'],
    starter: {
      python: 'class Solution:\n    def exist(self, board: list[list[str]], word: str) -> bool:\n        pass',
      cpp: 'class Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n    }\n};',
      java: 'class Solution {\n    public boolean exist(char[][] board, String word) {\n    }\n}',
      javascript: 'var exist = function(board, word) {\n};',
    },
    aiContext: 'Word Search — DFS with backtracking on grid',
  },
  {
    number: 12, title: 'Trapping Rain Water', difficulty: 'Hard',
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    companies: ['Amazon', 'Google', 'Goldman Sachs', 'Facebook'], acceptance: 58.1, premium: false,
    description: `Given <code>n</code> non-negative integers representing an elevation map, compute how much water can be trapped.`,
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' },
      { input: 'height = [4,2,0,3,2,5]', output: '9' },
    ],
    constraints: ['n == height.length', '1 ≤ n ≤ 2×10⁴'],
    testCases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expected: '6' },
      { input: '4 2 0 3 2 5', expected: '9' },
    ],
    hints: ['Two-pointer approach: lo and hi.', 'Water = min(maxLeft, maxRight) - height[i].', 'Advance the smaller max side.'],
    starter: {
      python: 'class Solution:\n    def trap(self, height: list[int]) -> int:\n        pass',
      cpp: 'class Solution {\npublic:\n    int trap(vector<int>& height) {\n    }\n};',
      java: 'class Solution {\n    public int trap(int[] height) {\n    }\n}',
      javascript: 'var trap = function(height) {\n};',
    },
    aiContext: 'Trapping Rain Water — two pointers or monotonic stack O(n)',
  },
  {
    number: 13, title: 'Reverse Linked List', difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'], companies: ['Amazon', 'Microsoft', 'Apple'],
    acceptance: 73.4, premium: false,
    description: `Given the head of a singly linked list, reverse it and return the new head.`,
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
    ],
    constraints: ['0 ≤ n ≤ 5000', '-5000 ≤ Node.val ≤ 5000'],
    testCases: [{ input: '1 2 3 4 5', expected: '5 4 3 2 1' }],
    hints: ['Use three pointers: prev, curr, next.', 'Iteratively reverse the links.', 'Or use recursion.'],
    starter: {
      python: '# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseList(self, head):\n        pass',
      cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n    }\n};',
      java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n    }\n}',
      javascript: 'var reverseList = function(head) {\n};',
    },
    aiContext: 'Reverse Linked List — iterative three-pointer or recursive O(n)',
  },
  {
    number: 14, title: 'Climbing Stairs', difficulty: 'Easy',
    tags: ['Math', 'Dynamic Programming', 'Memoization'], companies: ['Amazon', 'Apple', 'Adobe'],
    acceptance: 51.8, premium: false,
    description: `You are climbing a staircase with <code>n</code> steps. Each time you can climb 1 or 2 steps. Return the number of distinct ways to reach the top.`,
    examples: [
      { input: 'n = 2', output: '2', explanation: '1+1 or 2' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' },
    ],
    constraints: ['1 ≤ n ≤ 45'],
    testCases: [{ input: '2', expected: '2' }, { input: '3', expected: '3' }, { input: '10', expected: '89' }],
    hints: ['This is essentially Fibonacci.', 'dp[i] = dp[i-1] + dp[i-2].', 'Base cases: dp[1]=1, dp[2]=2.'],
    starter: {
      python: 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass',
      cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n    }\n};',
      java: 'class Solution {\n    public int climbStairs(int n) {\n    }\n}',
      javascript: 'var climbStairs = function(n) {\n};',
    },
    aiContext: 'Climbing Stairs — Fibonacci / DP O(n)',
  },
  {
    number: 15, title: '3Sum', difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Sorting'], companies: ['Google', 'Amazon', 'Facebook'],
    acceptance: 32.5, premium: false,
    description: `Find all unique triplets in <code>nums</code> such that they sum to zero.`,
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]' },
      { input: 'nums = [0,1,1]', output: '[]' },
      { input: 'nums = [0,0,0]', output: '[[0,0,0]]' },
    ],
    constraints: ['3 ≤ nums.length ≤ 3000'],
    testCases: [{ input: '-1 0 1 2 -1 -4', expected: '[[-1,-1,2],[-1,0,1]]' }],
    hints: ['Sort the array first.', 'Fix one element, use two pointers for the rest.', 'Skip duplicates carefully.'],
    starter: {
      python: 'class Solution:\n    def threeSum(self, nums: list[int]) -> list[list[int]]:\n        pass',
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n    }\n};',
      java: 'class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n    }\n}',
      javascript: 'var threeSum = function(nums) {\n};',
    },
    aiContext: '3Sum — sort + two pointers O(n²)',
  },
  {
    number: 16, title: 'Longest Common Subsequence', difficulty: 'Medium',
    tags: ['String', 'Dynamic Programming'], companies: ['Google', 'Amazon', 'Oracle'],
    acceptance: 56.7, premium: true,
    description: `Given two strings, return the length of their longest common subsequence.`,
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: '"ace"' },
      { input: 'text1 = "abc", text2 = "abc"', output: '3' },
    ],
    constraints: ['1 ≤ text1.length, text2.length ≤ 1000'],
    testCases: [{ input: 'abcde\nace', expected: '3' }],
    hints: ['Build a 2D DP table.', 'dp[i][j] = LCS of text1[:i] and text2[:j].', 'If chars match, dp[i][j] = dp[i-1][j-1]+1.'],
    starter: {
      python: 'class Solution:\n    def longestCommonSubsequence(self, text1: str, text2: str) -> int:\n        pass',
      cpp: 'class Solution {\npublic:\n    int longestCommonSubsequence(string text1, string text2) {\n    }\n};',
      java: 'class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n    }\n}',
      javascript: 'var longestCommonSubsequence = function(text1, text2) {\n};',
    },
    aiContext: 'LCS — 2D DP O(m*n)',
  },
  {
    number: 17, title: 'Number of Islands', difficulty: 'Medium',
    tags: ['Array', 'DFS', 'BFS', 'Union Find', 'Matrix'],
    companies: ['Amazon', 'Google', 'Facebook'], acceptance: 57.5, premium: false,
    description: `Given a grid of '1' (land) and '0' (water), return the number of islands.`,
    examples: [
      { input: 'grid=[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' },
      { input: 'grid=[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' },
    ],
    constraints: ['1 ≤ m, n ≤ 300'],
    testCases: [{ input: '1110\n1010\n1100\n0000', expected: '1' }],
    hints: ['DFS/BFS from each unvisited land cell.', 'Mark visited cells as water.', 'Count how many DFS starts you need.'],
    starter: {
      python: 'class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        pass',
      cpp: 'class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n    }\n};',
      java: 'class Solution {\n    public int numIslands(char[][] grid) {\n    }\n}',
      javascript: 'var numIslands = function(grid) {\n};',
    },
    aiContext: 'Number of Islands — DFS/BFS grid traversal O(m*n)',
  },
  {
    number: 18, title: 'Merge K Sorted Lists', difficulty: 'Hard',
    tags: ['Linked List', 'Divide and Conquer', 'Heap', 'Merge Sort'],
    companies: ['Google', 'Amazon', 'Facebook', 'Uber'], acceptance: 47.4, premium: true,
    description: `Merge k sorted linked lists and return one sorted list.`,
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
    ],
    constraints: ['k == lists.length', '0 ≤ k ≤ 10⁴'],
    testCases: [{ input: '1 4 5\n1 3 4\n2 6', expected: '1 1 2 3 4 4 5 6' }],
    hints: ['Use a min-heap of size k.', 'Or use divide and conquer — merge pairs.', 'Merging two sorted lists is O(n).'],
    starter: {
      python: 'class Solution:\n    def mergeKLists(self, lists):\n        pass',
      cpp: 'class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n    }\n};',
      java: 'class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n    }\n}',
      javascript: 'var mergeKLists = function(lists) {\n};',
    },
    aiContext: 'Merge K Sorted Lists — min-heap or divide & conquer O(n log k)',
  },
  {
    number: 19, title: 'Longest Palindromic Substring', difficulty: 'Medium',
    tags: ['String', 'Dynamic Programming'], companies: ['Amazon', 'Microsoft', 'Apple'],
    acceptance: 32.4, premium: false,
    description: `Given a string <code>s</code>, return the longest palindromic substring.`,
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also valid' },
      { input: 's = "cbbd"', output: '"bb"' },
    ],
    constraints: ['1 ≤ s.length ≤ 1000'],
    testCases: [{ input: 'babad', expected: 'bab' }],
    hints: ['Expand around center for each position.', 'Check both odd and even length palindromes.', 'Track the longest seen so far.'],
    starter: {
      python: 'class Solution:\n    def longestPalindrome(self, s: str) -> str:\n        pass',
      cpp: 'class Solution {\npublic:\n    string longestPalindrome(string s) {\n    }\n};',
      java: 'class Solution {\n    public String longestPalindrome(String s) {\n    }\n}',
      javascript: 'var longestPalindrome = function(s) {\n};',
    },
    aiContext: 'Longest Palindromic Substring — expand around center O(n²)',
  },
  {
    number: 20, title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard',
    tags: ['String', 'Tree', 'DFS', 'BFS', 'Design', 'Binary Tree'],
    companies: ['Facebook', 'Google', 'Microsoft', 'LinkedIn'], acceptance: 55.2, premium: true,
    description: `Design an algorithm to serialize and deserialize a binary tree.`,
    examples: [
      { input: 'root = [1,2,3,null,null,4,5]', output: '[1,2,3,null,null,4,5]' },
    ],
    constraints: ['0 ≤ number of nodes ≤ 10⁴'],
    testCases: [{ input: '1 2 3 null null 4 5', expected: '1,2,3,null,null,4,5' }],
    hints: ['BFS level-order works cleanly.', 'Use "null" as placeholder for missing nodes.', 'Split by comma to deserialize.'],
    starter: {
      python: 'class Codec:\n    def serialize(self, root):\n        pass\n\n    def deserialize(self, data):\n        pass',
      cpp: 'class Codec {\npublic:\n    string serialize(TreeNode* root) {}\n    TreeNode* deserialize(string data) {}\n};',
      java: 'public class Codec {\n    public String serialize(TreeNode root) {}\n    public TreeNode deserialize(String data) {}\n}',
      javascript: 'var serialize = function(root) {};\nvar deserialize = function(data) {};',
    },
    aiContext: 'Serialize and Deserialize Binary Tree — BFS level-order with null markers',
  },
];

let inserted = 0;
for (const p of problems) {
  const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  await Problem.create({ ...p, slug, aiContext: p.aiContext || `${p.title} — ${p.tags.join(', ')}` });
  inserted++;
  console.log(`  ✅ #${p.number} ${p.title}`);
}

console.log(`\n🎉 Seeded ${inserted} problems + admin user`);
await mongoose.disconnect();
