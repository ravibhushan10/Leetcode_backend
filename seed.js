import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Problem from './src/models/Problem.js';
import User from './src/models/User.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB');

// ── Clean stale indexes ───────────────────────────────────────────────────────
try {
  const userCol = mongoose.connection.db.collection('users');
  const existingIndexes = await userCol.indexes();
  for (const idx of existingIndexes) {
    if (idx.name === '_id_') continue;
    const keys = Object.keys(idx.key || {});
    const isOurIndex = keys.length === 1 && keys[0] === 'email';
    if (!isOurIndex) { await userCol.dropIndex(idx.name); }
  }
} catch (e) { console.log('ℹ️  No stale user indexes to clean'); }

try {
  const probCol = mongoose.connection.db.collection('problems');
  const existingIndexes = await probCol.indexes();
  for (const idx of existingIndexes) {
    if (idx.name === '_id_') continue;
    const keys = Object.keys(idx.key || {});
    const isOurIndex = (keys.length === 1 && (keys[0] === 'number' || keys[0] === 'slug'));
    if (!isOurIndex) { await probCol.dropIndex(idx.name); }
  }
} catch (e) { console.log('ℹ️  No stale problem indexes to clean'); }

await User.syncIndexes();
await Problem.syncIndexes();
console.log('✅ Indexes synced');

// ── Admin user ────────────────────────────────────────────────────────────────
try {
  await mongoose.connection.db.collection('users').deleteMany({ email: 'admin@codeforge.com' });
} catch (e) {}

const hash = await bcrypt.hash('admin123', 12);
await new User({
  name: 'Admin', email: 'admin@codeforge.com',
  passwordHash: hash, isAdmin: true, plan: 'pro',
  ratingTitle: 'Admin', oauthProvider: 'admin',
}).save();
console.log('✅ Admin user created');

await Problem.deleteMany({});
console.log('🧹 Cleared old problems');

// ── Problems ──────────────────────────────────────────────────────────────────
const problems = [

  // ── 1. Two Sum ──────────────────────────────────────────────────────────────
  {
    number: 1, title: 'Two Sum', difficulty: 'Easy',
    tags: ['Array', 'Hash Table'], companies: ['Google', 'Amazon', 'Apple'],
    acceptance: 49.2, premium: false,
    description: `Given an array of integers <code>nums</code> and an integer <code>target</code>, return <strong>indices</strong> of the two numbers such that they add up to target.<br><br>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9' },
      { input: 'nums = [3,2,4], target = 6',     output: '[1, 2]' },
      { input: 'nums = [3,3], target = 6',        output: '[0, 1]' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Only one valid answer exists'],
    testCases: [
      { input: '2 7 11 15\n9', expected: '[0, 1]', hidden: false },
      { input: '3 2 4\n6',     expected: '[1, 2]', hidden: false },
      { input: '3 3\n6',       expected: '[0, 1]', hidden: false },
      { input: '1 8 3 6\n9',   expected: '[0, 1]', hidden: true  },
      { input: '2 5 5 1\n10',  expected: '[1, 2]', hidden: true  },
    ],
    hints: [
      'Try using a hash map to store visited numbers.',
      'For each number, check if target - num exists in the map.',
      'Return indices immediately when complement is found.',
    ],
    starter: {
      python: `import sys
data = sys.stdin.read().split('\\n')
nums = list(map(int, data[0].split()))
target = int(data[1].strip())

# Write your solution here
def twoSum(nums, target):
    pass

print(twoSum(nums, target))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  string line; getline(cin, line);
  istringstream ss(line);
  vector<int> nums; int x;
  while(ss >> x) nums.push_back(x);
  int target; cin >> target;

  // Write your solution here
  // Print result: cout << "[" << i << ", " << j << "]\\n";

}`,
    },
    aiContext: 'Two Sum — find two indices that sum to target, classic hash map O(n)',
  },

  // ── 2. Valid Parentheses ────────────────────────────────────────────────────
  {
    number: 2, title: 'Valid Parentheses', difficulty: 'Easy',
    tags: ['String', 'Stack'], companies: ['Google', 'Facebook', 'Amazon'],
    acceptance: 40.6, premium: false,
    description: `Given a string <code>s</code> containing just <code>(</code>, <code>)</code>, <code>{</code>, <code>}</code>, <code>[</code> and <code>]</code>, determine if the input string is valid.<br><br>An input string is valid if open brackets are closed by the same type of brackets in the correct order.`,
    examples: [
      { input: 's = "()"',      output: 'true' },
      { input: 's = "()[]{}"',  output: 'true' },
      { input: 's = "(]"',      output: 'false' },
    ],
    constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of parentheses only'],
    testCases: [
      { input: '()',      expected: 'true',  hidden: false },
      { input: '()[]{}', expected: 'true',  hidden: false },
      { input: '(]',     expected: 'false', hidden: false },
      { input: '([)]',   expected: 'false', hidden: true  },
      { input: '{[]}',   expected: 'true',  hidden: true  },
      { input: ']',      expected: 'false', hidden: true  },
    ],
    hints: [
      'Use a stack data structure.',
      'Push opening brackets, pop on closing brackets.',
      'Stack must be empty at the end.',
    ],
    starter: {
      python: `import sys
s = sys.stdin.read().strip()

# Write your solution here
def isValid(s):
    pass

print(str(isValid(s)).lower())`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  string s; cin >> s;

  // Write your solution here
  // Print: cout << (result ? "true" : "false") << "\\n";

}`,
    },
    aiContext: 'Valid Parentheses — stack-based bracket matching',
  },

  // ── 3. Longest Substring Without Repeating Characters ──────────────────────
  {
    number: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Sliding Window'], companies: ['Google', 'Amazon', 'Facebook', 'Microsoft'],
    acceptance: 33.8, premium: false,
    description: `Given a string <code>s</code>, find the length of the <strong>longest substring</strong> without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: '"abc" has length 3' },
      { input: 's = "bbbbb"',    output: '1', explanation: '"b" has length 1' },
      { input: 's = "pwwkew"',   output: '3', explanation: '"wke" has length 3' },
    ],
    constraints: ['0 ≤ s.length ≤ 5×10⁴'],
    testCases: [
      { input: 'abcabcbb', expected: '3', hidden: false },
      { input: 'bbbbb',    expected: '1', hidden: false },
      { input: 'pwwkew',   expected: '3', hidden: false },
      { input: 'a',        expected: '1', hidden: true  },
      { input: 'dvdf',     expected: '3', hidden: true  },
    ],
    hints: [
      'Use sliding window with two pointers.',
      'Track chars in current window with a set.',
      'Shrink window from left when duplicate found.',
    ],
    starter: {
      python: `import sys
s = sys.stdin.read().strip()

# Write your solution here
def lengthOfLongestSubstring(s):
    pass

print(lengthOfLongestSubstring(s))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  string s; getline(cin, s);

  // Write your solution here

}`,
    },
    aiContext: 'Longest Substring Without Repeating Characters — sliding window O(n)',
  },

  // ── 4. Maximum Subarray ─────────────────────────────────────────────────────
  {
    number: 4, title: 'Maximum Subarray', difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'], companies: ['Amazon', 'Apple', 'LinkedIn'],
    acceptance: 49.5, premium: false,
    description: `Given an integer array <code>nums</code>, find the subarray with the largest sum, and return its sum.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has sum 6' },
      { input: 'nums = [1]',                       output: '1' },
      { input: 'nums = [5,4,-1,7,8]',              output: '23' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    testCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', expected: '6',  hidden: false },
      { input: '1',                      expected: '1',  hidden: false },
      { input: '5 4 -1 7 8',             expected: '23', hidden: false },
      { input: '-1 -2 -3',               expected: '-1', hidden: true  },
      { input: '-2 -1',                  expected: '-1', hidden: true  },
    ],
    hints: [
      "Kadane's algorithm runs in O(n).",
      'Keep a running sum, reset to current element when it drops below.',
      'Track the maximum seen so far.',
    ],
    starter: {
      python: `import sys
nums = list(map(int, sys.stdin.read().split()))

# Write your solution here
def maxSubArray(nums):
    pass

print(maxSubArray(nums))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<int> nums; int x;
  while(cin >> x) nums.push_back(x);

  // Write your solution here

}`,
    },
    aiContext: "Maximum Subarray — Kadane's algorithm O(n)",
  },

  // ── 5. Binary Search ────────────────────────────────────────────────────────
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
      { input: '-1 0 3 5 9 12\n9', expected: '4',  hidden: false },
      { input: '-1 0 3 5 9 12\n2', expected: '-1', hidden: false },
      { input: '5\n5',             expected: '0',  hidden: true  },
      { input: '1 3 5 7 9\n7',     expected: '3',  hidden: true  },
      { input: '1 3 5 7 9\n10',    expected: '-1', hidden: true  },
    ],
    hints: [
      'Maintain lo and hi pointers.',
      'Compute mid = (lo + hi) // 2.',
      'Move lo or hi based on comparison.',
    ],
    starter: {
      python: `import sys
data = sys.stdin.read().split('\\n')
nums = list(map(int, data[0].split()))
target = int(data[1].strip())

# Write your solution here
def search(nums, target):
    pass

print(search(nums, target))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  string line; getline(cin, line);
  istringstream ss(line);
  vector<int> nums; int x;
  while(ss >> x) nums.push_back(x);
  int target; cin >> target;

  // Write your solution here

}`,
    },
    aiContext: 'Binary Search — classic lo/hi pointer O(log n)',
  },

  // ── 6. Climbing Stairs ──────────────────────────────────────────────────────
  {
    number: 6, title: 'Climbing Stairs', difficulty: 'Easy',
    tags: ['Math', 'Dynamic Programming', 'Memoization'], companies: ['Amazon', 'Apple', 'Adobe'],
    acceptance: 51.8, premium: false,
    description: `You are climbing a staircase with <code>n</code> steps. Each time you can climb 1 or 2 steps. Return the number of distinct ways to reach the top.`,
    examples: [
      { input: 'n = 2', output: '2', explanation: '1+1 or 2' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' },
    ],
    constraints: ['1 ≤ n ≤ 45'],
    testCases: [
      { input: '2',  expected: '2',          hidden: false },
      { input: '3',  expected: '3',          hidden: false },
      { input: '1',  expected: '1',          hidden: true  },
      { input: '10', expected: '89',         hidden: true  },
      { input: '45', expected: '1836311903', hidden: true  },
    ],
    hints: [
      'This is essentially Fibonacci.',
      'dp[i] = dp[i-1] + dp[i-2].',
      'Base cases: dp[1]=1, dp[2]=2.',
    ],
    starter: {
      python: `import sys
n = int(sys.stdin.read().strip())

# Write your solution here
def climbStairs(n):
    pass

print(climbStairs(n))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  int n; cin >> n;

  // Write your solution here

}`,
    },
    aiContext: 'Climbing Stairs — Fibonacci / DP O(n)',
  },

  // ── 7. Reverse Linked List ──────────────────────────────────────────────────
  {
    number: 7, title: 'Reverse Linked List', difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'], companies: ['Amazon', 'Microsoft', 'Apple'],
    acceptance: 73.4, premium: false,
    description: `Given a linked list represented as space-separated integers, reverse it and print the result space-separated.`,
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '5 4 3 2 1' },
      { input: 'head = [1,2]',       output: '2 1' },
    ],
    constraints: ['0 ≤ n ≤ 5000', '-5000 ≤ Node.val ≤ 5000'],
    testCases: [
      { input: '1 2 3 4 5', expected: '5 4 3 2 1', hidden: false },
      { input: '1 2',       expected: '2 1',       hidden: false },
      { input: '1',         expected: '1',         hidden: true  },
      { input: '5 4 3 2 1', expected: '1 2 3 4 5', hidden: true  },
    ],
    hints: [
      'Use three pointers: prev, curr, next.',
      'Iteratively reverse the links.',
      'Or simply reverse the array.',
    ],
    starter: {
      python: `import sys
nums = list(map(int, sys.stdin.read().split()))

# Write your solution here
def reverseList(nums):
    pass

print(*reverseList(nums))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<int> nums; int x;
  while(cin >> x) nums.push_back(x);

  // Write your solution here
  // Print space-separated: for(int v : result) cout << v << " ";

}`,
    },
    aiContext: 'Reverse Linked List — iterative three-pointer or recursive O(n)',
  },

  // ── 8. Coin Change ──────────────────────────────────────────────────────────
  {
    number: 8, title: 'Coin Change', difficulty: 'Medium',
    tags: ['Dynamic Programming', 'BFS'], companies: ['Amazon', 'Google', 'Microsoft'],
    acceptance: 41.3, premium: false,
    description: `Given coins of different denominations and a total amount, return the fewest coins needed to make up that amount. Return <code>-1</code> if it is not possible.`,
    examples: [
      { input: 'coins = [1,5,10,25], amount = 41', output: '4', explanation: '25+10+5+1' },
      { input: 'coins = [2], amount = 3',           output: '-1' },
      { input: 'coins = [1], amount = 0',           output: '0' },
    ],
    constraints: ['1 ≤ coins.length ≤ 12', '0 ≤ amount ≤ 10⁴'],
    testCases: [
      { input: '1 5 10 25\n41', expected: '4',  hidden: false },
      { input: '2\n3',          expected: '-1', hidden: false },
      { input: '1\n0',          expected: '0',  hidden: false },
      { input: '1 2 5\n11',     expected: '3',  hidden: true  },
      { input: '186 419 83 408\n6249', expected: '20', hidden: true },
    ],
    hints: [
      'Define dp[i] = min coins for amount i.',
      'Initialize dp[0]=0, rest=infinity.',
      'dp[i] = min(dp[i], dp[i-coin]+1) for each coin.',
    ],
    starter: {
      python: `import sys
data = sys.stdin.read().split('\\n')
coins = list(map(int, data[0].split()))
amount = int(data[1].strip())

# Write your solution here
def coinChange(coins, amount):
    pass

print(coinChange(coins, amount))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  string line; getline(cin, line);
  istringstream ss(line);
  vector<int> coins; int x;
  while(ss >> x) coins.push_back(x);
  int amount; cin >> amount;

  // Write your solution here

}`,
    },
    aiContext: 'Coin Change — bottom-up DP O(n*amount)',
  },

  // ── 9. Trapping Rain Water ──────────────────────────────────────────────────
  {
    number: 9, title: 'Trapping Rain Water', difficulty: 'Hard',
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    companies: ['Amazon', 'Google', 'Goldman Sachs', 'Facebook'], acceptance: 58.1, premium: false,
    description: `Given <code>n</code> non-negative integers representing an elevation map, compute how much water can be trapped after raining.`,
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' },
      { input: 'height = [4,2,0,3,2,5]',              output: '9' },
    ],
    constraints: ['n == height.length', '1 ≤ n ≤ 2×10⁴', '0 ≤ height[i] ≤ 10⁵'],
    testCases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expected: '6', hidden: false },
      { input: '4 2 0 3 2 5',             expected: '9', hidden: false },
      { input: '1 0 1',                   expected: '1', hidden: true  },
      { input: '3 0 0 2 0 4',             expected: '10', hidden: true },
    ],
    hints: [
      'Two-pointer approach: lo and hi.',
      'Water = min(maxLeft, maxRight) - height[i].',
      'Advance the smaller max side.',
    ],
    starter: {
      python: `import sys
height = list(map(int, sys.stdin.read().split()))

# Write your solution here
def trap(height):
    pass

print(trap(height))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<int> height; int x;
  while(cin >> x) height.push_back(x);

  // Write your solution here

}`,
    },
    aiContext: 'Trapping Rain Water — two pointers or monotonic stack O(n)',
  },

  // ── 10. 3Sum ────────────────────────────────────────────────────────────────
  {
    number: 10, title: '3Sum', difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Sorting'], companies: ['Google', 'Amazon', 'Facebook'],
    acceptance: 32.5, premium: false,
    description: `Find all unique triplets in <code>nums</code> such that they sum to zero. The solution set must not contain duplicate triplets.<br><br>Print each triplet on a separate line as space-separated values, sorted in non-decreasing order.`,
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '-1 -1 2\n-1 0 1' },
      { input: 'nums = [0,1,1]',          output: '' },
      { input: 'nums = [0,0,0]',          output: '0 0 0' },
    ],
    constraints: ['3 ≤ nums.length ≤ 3000', '-10⁵ ≤ nums[i] ≤ 10⁵'],
    testCases: [
      { input: '-1 0 1 2 -1 -4', expected: '-1 -1 2\n-1 0 1', hidden: false },
      { input: '0 1 1',          expected: '',                  hidden: false },
      { input: '0 0 0',          expected: '0 0 0',            hidden: false },
      { input: '-2 0 1 1 2',     expected: '-2 0 2\n-2 1 1',   hidden: true  },
    ],
    hints: [
      'Sort the array first.',
      'Fix one element, use two pointers for the rest.',
      'Skip duplicates carefully.',
    ],
    starter: {
      python: `import sys
nums = list(map(int, sys.stdin.read().split()))

# Write your solution here
# Print each triplet on a new line as: print(a, b, c)
def threeSum(nums):
    pass

result = threeSum(nums)
for triplet in result:
    print(*triplet)`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<int> nums; int x;
  while(cin >> x) nums.push_back(x);

  // Write your solution here
  // Print each triplet: cout << a << " " << b << " " << c << "\\n";

}`,
    },
    aiContext: '3Sum — sort + two pointers O(n²)',
  },

  // ── 11. Merge Intervals ─────────────────────────────────────────────────────
  {
    number: 11, title: 'Merge Intervals', difficulty: 'Medium',
    tags: ['Array', 'Sorting'], companies: ['Facebook', 'Google', 'Twitter'],
    acceptance: 45.8, premium: false,
    description: `Given an array of intervals where each interval is given as two space-separated integers per line, merge all overlapping intervals and return the result.<br><br>Print each merged interval on a new line.`,
    examples: [
      { input: '1 3\n2 6\n8 10\n15 18', output: '1 6\n8 10\n15 18' },
      { input: '1 4\n4 5',              output: '1 5' },
    ],
    constraints: ['1 ≤ intervals.length ≤ 10⁴', 'intervals[i].length == 2'],
    testCases: [
      { input: '1 3\n2 6\n8 10\n15 18', expected: '1 6\n8 10\n15 18', hidden: false },
      { input: '1 4\n4 5',              expected: '1 5',               hidden: false },
      { input: '1 4\n2 3',              expected: '1 4',               hidden: true  },
      { input: '1 2\n3 4\n5 6',         expected: '1 2\n3 4\n5 6',    hidden: true  },
    ],
    hints: [
      'Sort intervals by start time.',
      'Compare each with the last merged interval.',
      'Merge if overlap, otherwise append.',
    ],
    starter: {
      python: `import sys
lines = sys.stdin.read().strip().split('\\n')
intervals = [list(map(int, line.split())) for line in lines]

# Write your solution here
def merge(intervals):
    pass

for interval in merge(intervals):
    print(*interval)`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<pair<int,int>> intervals;
  int a, b;
  while(cin >> a >> b) intervals.push_back({a, b});

  // Write your solution here
  // Print each merged interval: cout << a << " " << b << "\\n";

}`,
    },
    aiContext: 'Merge Intervals — sort then linear scan O(n log n)',
  },

  // ── 12. Longest Common Subsequence ─────────────────────────────────────────
  {
    number: 12, title: 'Longest Common Subsequence', difficulty: 'Medium',
    tags: ['String', 'Dynamic Programming'], companies: ['Google', 'Amazon', 'Oracle'],
    acceptance: 56.7, premium: true,
    description: `Given two strings (one per line), return the length of their longest common subsequence.`,
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: '"ace" is LCS' },
      { input: 'text1 = "abc", text2 = "abc"',   output: '3' },
    ],
    constraints: ['1 ≤ text1.length, text2.length ≤ 1000'],
    testCases: [
      { input: 'abcde\nace', expected: '3', hidden: false },
      { input: 'abc\nabc',   expected: '3', hidden: false },
      { input: 'abc\ndef',   expected: '0', hidden: true  },
      { input: 'bl\nybyml',  expected: '2', hidden: true  },
    ],
    hints: [
      'Build a 2D DP table.',
      'dp[i][j] = LCS of text1[:i] and text2[:j].',
      'If chars match, dp[i][j] = dp[i-1][j-1]+1.',
    ],
    starter: {
      python: `import sys
data = sys.stdin.read().split('\\n')
text1 = data[0].strip()
text2 = data[1].strip()

# Write your solution here
def longestCommonSubsequence(text1, text2):
    pass

print(longestCommonSubsequence(text1, text2))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  string text1, text2;
  getline(cin, text1);
  getline(cin, text2);

  // Write your solution here

}`,
    },
    aiContext: 'LCS — 2D DP O(m*n)',
  },

  // ── 13. Number of Islands ───────────────────────────────────────────────────
  {
    number: 13, title: 'Number of Islands', difficulty: 'Medium',
    tags: ['Array', 'DFS', 'BFS', 'Union Find', 'Matrix'],
    companies: ['Amazon', 'Google', 'Facebook'], acceptance: 57.5, premium: false,
    description: `Given a grid of '1' (land) and '0' (water), return the number of islands.<br><br>Each row of the grid is given as a string of 0s and 1s (no spaces).`,
    examples: [
      { input: '11110\n11010\n11000\n00000', output: '1' },
      { input: '11000\n11000\n00100\n00011', output: '3' },
    ],
    constraints: ['1 ≤ m, n ≤ 300'],
    testCases: [
      { input: '11110\n11010\n11000\n00000', expected: '1', hidden: false },
      { input: '11000\n11000\n00100\n00011', expected: '3', hidden: false },
      { input: '1',                          expected: '1', hidden: true  },
      { input: '0',                          expected: '0', hidden: true  },
      { input: '111\n010\n111',              expected: '1', hidden: true  },
    ],
    hints: [
      'DFS/BFS from each unvisited land cell.',
      'Mark visited cells as water.',
      'Count how many DFS starts you need.',
    ],
    starter: {
      python: `import sys
lines = sys.stdin.read().strip().split('\\n')
grid = [list(line) for line in lines]

# Write your solution here
def numIslands(grid):
    pass

print(numIslands(grid))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<vector<char>> grid;
  string line;
  while(getline(cin, line)) {
    vector<char> row(line.begin(), line.end());
    grid.push_back(row);
  }

  // Write your solution here

}`,
    },
    aiContext: 'Number of Islands — DFS/BFS grid traversal O(m*n)',
  },

  // ── 14. Median of Two Sorted Arrays ────────────────────────────────────────
  {
    number: 14, title: 'Median of Two Sorted Arrays', difficulty: 'Hard',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    companies: ['Google', 'Amazon', 'Goldman Sachs'], acceptance: 36.2, premium: true,
    description: `Given two sorted arrays (one per line), return the median of the merged array rounded to 5 decimal places.<br><br>The solution must run in <code>O(log(m+n))</code>.`,
    examples: [
      { input: 'nums1 = [1,3], nums2 = [2]',    output: '2.00000' },
      { input: 'nums1 = [1,2], nums2 = [3,4]',  output: '2.50000' },
    ],
    constraints: ['0 ≤ m,n ≤ 1000', '1 ≤ m+n ≤ 2000'],
    testCases: [
      { input: '1 3\n2',   expected: '2.00000', hidden: false },
      { input: '1 2\n3 4', expected: '2.50000', hidden: false },
      { input: '0 0\n0 0', expected: '0.00000', hidden: true  },
      { input: '2\n1 3',   expected: '2.00000', hidden: true  },
    ],
    hints: [
      'Binary search on the shorter array.',
      'Find the correct partition.',
      'Ensure max(left) ≤ min(right).',
    ],
    starter: {
      python: `import sys
data = sys.stdin.read().split('\\n')
nums1 = list(map(int, data[0].split()))
nums2 = list(map(int, data[1].split()))

# Write your solution here
def findMedianSortedArrays(nums1, nums2):
    pass

print(f"{findMedianSortedArrays(nums1, nums2):.5f}")`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  string l1, l2;
  getline(cin, l1); getline(cin, l2);
  istringstream s1(l1), s2(l2);
  vector<int> nums1, nums2; int x;
  while(s1>>x) nums1.push_back(x);
  while(s2>>x) nums2.push_back(x);

  // Write your solution here
  // printf("%.5f\\n", result);

}`,
    },
    aiContext: 'Median of Two Sorted Arrays — binary search partition O(log(min(m,n)))',
  },

  // ── 15. LRU Cache ───────────────────────────────────────────────────────────
  {
    number: 15, title: 'LRU Cache', difficulty: 'Medium',
    tags: ['Hash Table', 'Linked List', 'Design'],
    companies: ['Google', 'Amazon', 'Microsoft', 'Facebook'], acceptance: 42.1, premium: false,
    description: `Design an LRU cache supporting <code>get(key)</code> and <code>put(key, value)</code> in <code>O(1)</code>.<br><br><strong>Input format:</strong> First line is capacity, then operations (<code>get k</code> or <code>put k v</code>). Print each <code>get</code> result on a new line (-1 if not found).`,
    examples: [
      { input: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2', output: '1\n-1', explanation: 'After put(3,3) key 2 is evicted' },
    ],
    constraints: ['1 ≤ capacity ≤ 3000'],
    testCases: [
      { input: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2',         expected: '1\n-1',    hidden: false },
      { input: '1\nput 2 1\nget 2\nput 3 2\nget 2\nget 3',           expected: '1\n-1\n2', hidden: true  },
      { input: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 1\nget 3',  expected: '1\n1\n3',  hidden: true  },
    ],
    hints: [
      'Use OrderedDict in Python or LinkedHashMap in Java.',
      'On get: move key to end.',
      'On put: if full, evict the front.',
    ],
    starter: {
      python: `import sys
from collections import OrderedDict
lines = sys.stdin.read().strip().split('\\n')
capacity = int(lines[0])

# Write your solution here
class LRUCache:
    def __init__(self, capacity):
        pass
    def get(self, key):
        pass
    def put(self, key, value):
        pass

cache = LRUCache(capacity)
for line in lines[1:]:
    parts = line.split()
    if parts[0] == 'get':
        print(cache.get(int(parts[1])))
    elif parts[0] == 'put':
        cache.put(int(parts[1]), int(parts[2]))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;

// Write your LRUCache class here

int main(){
  int capacity; cin >> capacity; cin.ignore();
  string line;
  while(getline(cin, line)){
    istringstream ss(line);
    string op; ss >> op;
    if(op == "get"){
      int k; ss >> k;
      // cout << cache.get(k) << "\\n";
    } else {
      int k, v; ss >> k >> v;
      // cache.put(k, v);
    }
  }
}`,
    },
    aiContext: 'LRU Cache — OrderedDict or doubly linked list + hash map O(1)',
  },

  // ── 16. Contains Duplicate ──────────────────────────────────────────────────
  {
    number: 16, title: 'Contains Duplicate', difficulty: 'Easy',
    tags: ['Array', 'Hash Table', 'Sorting'], companies: ['Amazon', 'Google', 'Apple'],
    acceptance: 61.4, premium: false,
    description: `Given an integer array <code>nums</code>, return <code>true</code> if any value appears <strong>at least twice</strong>, and <code>false</code> if every element is distinct.`,
    examples: [
      { input: 'nums = [1,2,3,1]',      output: 'true',  explanation: '1 appears twice' },
      { input: 'nums = [1,2,3,4]',      output: 'false', explanation: 'all distinct' },
      { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', output: 'true' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁹ ≤ nums[i] ≤ 10⁹'],
    testCases: [
      { input: '1 2 3 1',           expected: 'true',  hidden: false },
      { input: '1 2 3 4',           expected: 'false', hidden: false },
      { input: '1 1 1 3 3 4 3 2 4 2', expected: 'true', hidden: false },
      { input: '1',                 expected: 'false', hidden: true  },
      { input: '-1 -1',             expected: 'true',  hidden: true  },
    ],
    hints: [
      'Use a hash set to track seen numbers.',
      'If a number is already in the set, return true.',
      'Alternatively sort and check adjacent elements.',
    ],
    starter: {
      python: `import sys
nums = list(map(int, sys.stdin.read().split()))

# Write your solution here
def containsDuplicate(nums):
    pass

print(str(containsDuplicate(nums)).lower())`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<int> nums; int x;
  while(cin >> x) nums.push_back(x);

  // Write your solution here
  // Print: cout << (result ? "true" : "false") << "\\n";

}`,
    },
    aiContext: 'Contains Duplicate — hash set O(n)',
  },

  // ── 17. Best Time to Buy and Sell Stock ─────────────────────────────────────
  {
    number: 17, title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy',
    tags: ['Array', 'Dynamic Programming'], companies: ['Amazon', 'Facebook', 'Microsoft'],
    acceptance: 54.2, premium: false,
    description: `Given an array <code>prices</code> where <code>prices[i]</code> is the price of a stock on day <code>i</code>, return the <strong>maximum profit</strong> you can achieve from one buy and one sell. Return <code>0</code> if no profit is possible.`,
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price=1), sell on day 5 (price=6)' },
      { input: 'prices = [7,6,4,3,1]',   output: '0', explanation: 'Prices only decrease, no profit possible' },
    ],
    constraints: ['1 ≤ prices.length ≤ 10⁵', '0 ≤ prices[i] ≤ 10⁴'],
    testCases: [
      { input: '7 1 5 3 6 4', expected: '5', hidden: false },
      { input: '7 6 4 3 1',   expected: '0', hidden: false },
      { input: '2 4 1',       expected: '2', hidden: true  },
      { input: '1',           expected: '0', hidden: true  },
      { input: '3 2 6 5 0 3', expected: '4', hidden: true  },
    ],
    hints: [
      'Track the minimum price seen so far.',
      'For each price compute profit = price - minPrice.',
      'Update maxProfit if current profit is higher.',
    ],
    starter: {
      python: `import sys
prices = list(map(int, sys.stdin.read().split()))

# Write your solution here
def maxProfit(prices):
    pass

print(maxProfit(prices))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<int> prices; int x;
  while(cin >> x) prices.push_back(x);

  // Write your solution here

}`,
    },
    aiContext: 'Best Time to Buy and Sell Stock — single pass tracking min price O(n)',
  },

  // ── 18. Product of Array Except Self ────────────────────────────────────────
  {
    number: 18, title: 'Product of Array Except Self', difficulty: 'Medium',
    tags: ['Array', 'Prefix Sum'], companies: ['Amazon', 'Facebook', 'Microsoft', 'Google'],
    acceptance: 64.8, premium: false,
    description: `Given an integer array <code>nums</code>, return an array <code>answer</code> such that <code>answer[i]</code> is the product of all elements except <code>nums[i]</code>.<br><br>You must run in <code>O(n)</code> without using division. Print the result space-separated.`,
    examples: [
      { input: 'nums = [1,2,3,4]',   output: '24 12 8 6' },
      { input: 'nums = [-1,1,0,-3,3]', output: '0 0 9 0 0' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁵', '-30 ≤ nums[i] ≤ 30', 'Product of any prefix/suffix fits in 32-bit int'],
    testCases: [
      { input: '1 2 3 4',     expected: '24 12 8 6', hidden: false },
      { input: '-1 1 0 -3 3', expected: '0 0 9 0 0', hidden: false },
      { input: '1 1',         expected: '1 1',        hidden: true  },
      { input: '2 3 4 5',     expected: '60 40 30 24', hidden: true },
    ],
    hints: [
      'Build a prefix product array from the left.',
      'Build a suffix product array from the right.',
      'answer[i] = prefix[i-1] * suffix[i+1].',
    ],
    starter: {
      python: `import sys
nums = list(map(int, sys.stdin.read().split()))

# Write your solution here
def productExceptSelf(nums):
    pass

print(*productExceptSelf(nums))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<int> nums; int x;
  while(cin >> x) nums.push_back(x);

  // Write your solution here
  // Print space-separated result

}`,
    },
    aiContext: 'Product of Array Except Self — prefix and suffix products O(n) no division',
  },

  // ── 19. Find Minimum in Rotated Sorted Array ────────────────────────────────
  {
    number: 19, title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium',
    tags: ['Array', 'Binary Search'], companies: ['Microsoft', 'Amazon', 'Facebook'],
    acceptance: 48.9, premium: false,
    description: `Given a sorted array that has been rotated between 1 and n times, find the minimum element.<br><br>You must write an algorithm that runs in <code>O(log n)</code>.`,
    examples: [
      { input: 'nums = [3,4,5,1,2]',         output: '1', explanation: 'Original: [1,2,3,4,5], rotated 3 times' },
      { input: 'nums = [4,5,6,7,0,1,2]',     output: '0' },
      { input: 'nums = [11,13,15,17]',        output: '11', explanation: 'Array not rotated' },
    ],
    constraints: ['1 ≤ nums.length ≤ 5000', '-5000 ≤ nums[i] ≤ 5000', 'All values are unique'],
    testCases: [
      { input: '3 4 5 1 2',     expected: '1',  hidden: false },
      { input: '4 5 6 7 0 1 2', expected: '0',  hidden: false },
      { input: '11 13 15 17',   expected: '11', hidden: false },
      { input: '2 1',           expected: '1',  hidden: true  },
      { input: '1',             expected: '1',  hidden: true  },
    ],
    hints: [
      'Use binary search — O(log n) is required.',
      'The minimum is at the inflection point.',
      'If nums[mid] > nums[right], minimum is in the right half.',
    ],
    starter: {
      python: `import sys
nums = list(map(int, sys.stdin.read().split()))

# Write your solution here
def findMin(nums):
    pass

print(findMin(nums))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<int> nums; int x;
  while(cin >> x) nums.push_back(x);

  // Write your solution here

}`,
    },
    aiContext: 'Find Minimum in Rotated Sorted Array — binary search O(log n)',
  },

  // ── 20. Majority Element ────────────────────────────────────────────────────
  {
    number: 20, title: 'Majority Element', difficulty: 'Easy',
    tags: ['Array', 'Hash Table', 'Divide and Conquer', 'Sorting', 'Counting'],
    companies: ['Amazon', 'Apple', 'Google'], acceptance: 63.5, premium: false,
    description: `Given an array of size <code>n</code>, return the <strong>majority element</strong> — the element that appears more than <code>⌊n/2⌋</code> times.<br><br>You may assume the majority element always exists.`,
    examples: [
      { input: 'nums = [3,2,3]',               output: '3' },
      { input: 'nums = [2,2,1,1,1,2,2]',       output: '2' },
    ],
    constraints: ['1 ≤ n ≤ 5×10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Majority element always exists'],
    testCases: [
      { input: '3 2 3',         expected: '3', hidden: false },
      { input: '2 2 1 1 1 2 2', expected: '2', hidden: false },
      { input: '1',             expected: '1', hidden: true  },
      { input: '6 5 5',         expected: '5', hidden: true  },
      { input: '1 1 2 1 3',     expected: '1', hidden: true  },
    ],
    hints: [
      "Boyer-Moore Voting Algorithm runs in O(n) O(1) space.",
      'Keep a candidate and a count.',
      'Increment count if same as candidate, else decrement. Reset at 0.',
    ],
    starter: {
      python: `import sys
nums = list(map(int, sys.stdin.read().split()))

# Write your solution here
def majorityElement(nums):
    pass

print(majorityElement(nums))`,

      cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
  vector<int> nums; int x;
  while(cin >> x) nums.push_back(x);

  // Write your solution here

}`,
    },
    aiContext: 'Majority Element — Boyer-Moore Voting Algorithm O(n) O(1)',
  },

];

// ── Seed ─────────────────────────────────────────────────────────────────────
let inserted = 0;
for (const p of problems) {
  const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  await Problem.create({ ...p, slug, aiContext: p.aiContext || `${p.title} — ${p.tags.join(', ')}` });
  inserted++;
  console.log(` #${p.number} ${p.title}`);
}

console.log(`\nSeeded ${inserted} problems + admin user`);
await mongoose.disconnect();
