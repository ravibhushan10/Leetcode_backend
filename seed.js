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

  // ── 1. Two Sum ───────────────────────────────────────────────────────────────
  {
    number: 1, title: 'Two Sum', slug: 'two-sum', difficulty: 'Easy',
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

    // ── what user sees in editor ──────────────────────────────────────────────
    starter: {
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {

    }
};`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        `,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {

};`,
      c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {

}`,
    },

    // ── full code sent to Judge0 ──────────────────────────────────────────────
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string line; getline(cin, line);
    istringstream ss(line);
    vector<int> nums; int x;
    while (ss >> x) nums.push_back(x);
    int target; cin >> target;
    Solution sol;
    vector<int> res = sol.twoSum(nums, target);
    cout << "[" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

data = sys.stdin.read().split('\\n')
nums = list(map(int, data[0].split()))
target = int(data[1].strip())
print(Solution().twoSum(nums, target))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().trim().split(" ");
        int target = sc.nextInt();
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        int[] res = new Solution().twoSum(nums, target);
        System.out.println("[" + res[0] + ", " + res[1] + "]");
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const nums = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);

__USER_CODE__

const res = twoSum(nums, target);
console.log('[' + res[0] + ', ' + res[1] + ']');`,
      c: `#include <stdio.h>
#include <stdlib.h>

__USER_CODE__

int main() {
    int nums[10001], n = 0, target;
    char buf[200000]; fgets(buf, sizeof(buf), stdin);
    char *p = buf;
    while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } nums[n++] = strtol(p, &p, 10); }
    scanf("%d", &target);
    int returnSize;
    int* res = twoSum(nums, n, target, &returnSize);
    printf("[%d, %d]\\n", res[0], res[1]);
    free(res);
    return 0;
}`,
    },
    aiContext: 'Two Sum — find two indices that sum to target, classic hash map O(n)',
  },

  // ── 2. Valid Parentheses ─────────────────────────────────────────────────────
  {
    number: 2, title: 'Valid Parentheses', slug: 'valid-parentheses', difficulty: 'Easy',
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
      cpp: `class Solution {
public:
    bool isValid(string s) {

    }
};`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        `,
      java: `class Solution {
    public boolean isValid(String s) {

    }
}`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {

};`,
      c: `bool isValid(char* s) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string s; getline(cin, s);
    Solution sol;
    cout << (sol.isValid(s) ? "true" : "false") << endl;
    return 0;
}`,
      python: `import sys

__USER_CODE__

s = sys.stdin.read().strip()
print(str(Solution().isValid(s)).lower())`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        String s = new Scanner(System.in).nextLine().trim();
        System.out.println(new Solution().isValid(s));
    }
}`,
      javascript: `const s = require('fs').readFileSync('/dev/stdin', 'utf8').trim();

__USER_CODE__

console.log(String(isValid(s)));`,
      c: `#include <stdio.h>
#include <stdbool.h>
#include <string.h>

__USER_CODE__

int main() {
    char s[10001]; scanf("%s", s);
    printf("%s\\n", isValid(s) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Valid Parentheses — stack-based bracket matching',
  },

  // ── 3. Best Time to Buy and Sell Stock ───────────────────────────────────────
  {
    number: 3, title: 'Best Time to Buy and Sell Stock', slug: 'best-time-to-buy-and-sell-stock', difficulty: 'Easy',
    tags: ['Array', 'Dynamic Programming'], companies: ['Amazon', 'Facebook', 'Bloomberg'],
    acceptance: 54.4, premium: false,
    description: `Given an array where <code>prices[i]</code> is the price on day <code>i</code>, return the maximum profit from one buy-sell transaction. Return 0 if no profit is possible.`,
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2, sell on day 5' },
      { input: 'prices = [7,6,4,3,1]',   output: '0', explanation: 'No profit possible' },
    ],
    constraints: ['1 ≤ prices.length ≤ 10⁵', '0 ≤ prices[i] ≤ 10⁴'],
    testCases: [
      { input: '7 1 5 3 6 4', expected: '5', hidden: false },
      { input: '7 6 4 3 1',   expected: '0', hidden: false },
      { input: '1',           expected: '0', hidden: true  },
      { input: '2 4 1',       expected: '2', hidden: true  },
      { input: '3 3 3',       expected: '0', hidden: true  },
    ],
    hints: [
      'Track minimum price seen so far.',
      'At each step compute profit = price - minSoFar.',
      'Track maximum profit seen.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {

    }
};`,
      python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        `,
      java: `class Solution {
    public int maxProfit(int[] prices) {

    }
}`,
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {

};`,
      c: `int maxProfit(int* prices, int pricesSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> prices; int x;
    while (cin >> x) prices.push_back(x);
    Solution sol;
    cout << sol.maxProfit(prices) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

prices = list(map(int, sys.stdin.read().split()))
print(Solution().maxProfit(prices))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] prices = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().maxProfit(prices));
    }
}`,
      javascript: `const prices = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(maxProfit(prices));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int prices[100001], n = 0;
    while (scanf("%d", &prices[n]) == 1) n++;
    printf("%d\\n", maxProfit(prices, n));
    return 0;
}`,
    },
    aiContext: 'Best Time to Buy and Sell Stock — one pass min tracking O(n)',
  },

  // ── 4. Maximum Subarray ──────────────────────────────────────────────────────
  {
    number: 4, title: 'Maximum Subarray', slug: 'maximum-subarray', difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'], companies: ['Amazon', 'Apple', 'LinkedIn'],
    acceptance: 49.5, premium: false,
    description: `Given an integer array <code>nums</code>, find the subarray with the largest sum and return its sum.`,
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
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        `,
      java: `class Solution {
    public int maxSubArray(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {

};`,
      c: `int maxSubArray(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    cout << sol.maxSubArray(nums) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(Solution().maxSubArray(nums))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().maxSubArray(nums));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(maxSubArray(nums));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[100001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    printf("%d\\n", maxSubArray(nums, n));
    return 0;
}`,
    },
    aiContext: "Maximum Subarray — Kadane's algorithm O(n)",
  },

  // ── 5. Climbing Stairs ───────────────────────────────────────────────────────
  {
    number: 5, title: 'Climbing Stairs', slug: 'climbing-stairs', difficulty: 'Easy',
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
      cpp: `class Solution {
public:
    int climbStairs(int n) {

    }
};`,
      python: `class Solution:
    def climbStairs(self, n: int) -> int:
        `,
      java: `class Solution {
    public int climbStairs(int n) {

    }
}`,
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {

};`,
      c: `int climbStairs(int n) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    Solution sol;
    cout << sol.climbStairs(n) << endl;
    return 0;
}`,
      python: `import sys

__USER_CODE__

n = int(sys.stdin.read().strip())
print(Solution().climbStairs(n))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        System.out.println(new Solution().climbStairs(n));
    }
}`,
      javascript: `const n = parseInt(require('fs').readFileSync('/dev/stdin', 'utf8').trim());

__USER_CODE__

console.log(climbStairs(n));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int n; scanf("%d", &n);
    printf("%d\\n", climbStairs(n));
    return 0;
}`,
    },
    aiContext: 'Climbing Stairs — Fibonacci / DP O(n)',
  },

  // ── 6. Binary Search ─────────────────────────────────────────────────────────
  {
    number: 6, title: 'Binary Search', slug: 'binary-search', difficulty: 'Easy',
    tags: ['Array', 'Binary Search'], companies: ['Microsoft', 'Google'],
    acceptance: 55.3, premium: false,
    description: `Given a sorted array of integers <code>nums</code> and integer <code>target</code>, return the index if found, else return <code>-1</code>.<br><br>You must write an algorithm with <code>O(log n)</code> runtime complexity.`,
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
      'Compute mid = (lo + hi) / 2.',
      'Move lo or hi based on comparison.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {

    }
};`,
      python: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        `,
      java: `class Solution {
    public int search(int[] nums, int target) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {

};`,
      c: `int search(int* nums, int numsSize, int target) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string line; getline(cin, line);
    istringstream ss(line);
    vector<int> nums; int x;
    while (ss >> x) nums.push_back(x);
    int target; cin >> target;
    Solution sol;
    cout << sol.search(nums, target) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

data = sys.stdin.read().split('\\n')
nums = list(map(int, data[0].split()))
target = int(data[1].strip())
print(Solution().search(nums, target))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        int target = sc.nextInt();
        System.out.println(new Solution().search(nums, target));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const nums = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);

__USER_CODE__

console.log(search(nums, target));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[10001], n = 0, target;
    char buf[200000]; fgets(buf, sizeof(buf), stdin);
    char *p = buf;
    while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } nums[n++] = strtol(p, &p, 10); }
    scanf("%d", &target);
    printf("%d\\n", search(nums, n, target));
    return 0;
}`,
    },
    aiContext: 'Binary Search — classic lo/hi pointer O(log n)',
  },

  // ── 7. Single Number ─────────────────────────────────────────────────────────
  {
    number: 7, title: 'Single Number', slug: 'single-number', difficulty: 'Easy',
    tags: ['Array', 'Bit Manipulation'], companies: ['Amazon', 'Apple', 'Airbnb'],
    acceptance: 70.6, premium: false,
    description: `Given a non-empty array where every element appears twice except for one, find that single one.<br><br>Must run in linear time and use only constant extra space.`,
    examples: [
      { input: 'nums = [2,2,1]',     output: '1' },
      { input: 'nums = [4,1,2,1,2]', output: '4' },
      { input: 'nums = [1]',         output: '1' },
    ],
    constraints: ['1 ≤ nums.length ≤ 3×10⁴', 'Each element appears twice except one'],
    testCases: [
      { input: '2 2 1',     expected: '1', hidden: false },
      { input: '4 1 2 1 2', expected: '4', hidden: false },
      { input: '1',         expected: '1', hidden: false },
      { input: '0 1 0',     expected: '1', hidden: true  },
      { input: '7 3 7',     expected: '3', hidden: true  },
    ],
    hints: [
      'XOR of a number with itself is 0.',
      'XOR of a number with 0 is the number itself.',
      'XOR all elements together.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int singleNumber(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        `,
      java: `class Solution {
    public int singleNumber(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var singleNumber = function(nums) {

};`,
      c: `int singleNumber(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    cout << sol.singleNumber(nums) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(Solution().singleNumber(nums))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().singleNumber(nums));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(singleNumber(nums));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[30001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    printf("%d\\n", singleNumber(nums, n));
    return 0;
}`,
    },
    aiContext: 'Single Number — XOR trick O(n) O(1) space',
  },

  // ── 8. Missing Number ────────────────────────────────────────────────────────
  {
    number: 8, title: 'Missing Number', slug: 'missing-number', difficulty: 'Easy',
    tags: ['Array', 'Math', 'Bit Manipulation'], companies: ['Microsoft', 'Amazon', 'Bloomberg'],
    acceptance: 62.8, premium: false,
    description: `Given an array containing <code>n</code> distinct numbers in range <code>[0, n]</code>, return the one that is missing.`,
    examples: [
      { input: 'nums = [3,0,1]',             output: '2' },
      { input: 'nums = [0,1]',               output: '2' },
      { input: 'nums = [9,6,4,2,3,5,7,0,1]', output: '8' },
    ],
    constraints: ['1 ≤ n ≤ 10⁴', 'All numbers are unique in range [0,n]'],
    testCases: [
      { input: '3 0 1',             expected: '2', hidden: false },
      { input: '0 1',               expected: '2', hidden: false },
      { input: '9 6 4 2 3 5 7 0 1', expected: '8', hidden: false },
      { input: '0',                 expected: '1', hidden: true  },
      { input: '1',                 expected: '0', hidden: true  },
    ],
    hints: [
      'Expected sum = n*(n+1)/2.',
      'Subtract actual sum from expected sum.',
      'Or XOR all indices and values.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int missingNumber(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        `,
      java: `class Solution {
    public int missingNumber(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var missingNumber = function(nums) {

};`,
      c: `int missingNumber(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    cout << sol.missingNumber(nums) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(Solution().missingNumber(nums))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().missingNumber(nums));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(missingNumber(nums));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[10001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    printf("%d\\n", missingNumber(nums, n));
    return 0;
}`,
    },
    aiContext: 'Missing Number — Gauss sum formula O(n)',
  },

  // ── 9. Majority Element ──────────────────────────────────────────────────────
  {
    number: 9, title: 'Majority Element', slug: 'majority-element', difficulty: 'Easy',
    tags: ['Array', 'Hash Table', 'Sorting', 'Counting'], companies: ['Adobe', 'Google', 'Yahoo'],
    acceptance: 63.6, premium: false,
    description: `Given an array of size <code>n</code>, return the majority element — the element that appears more than <code>⌊n/2⌋</code> times. The majority element always exists.`,
    examples: [
      { input: 'nums = [3,2,3]',         output: '3' },
      { input: 'nums = [2,2,1,1,1,2,2]', output: '2' },
    ],
    constraints: ['1 ≤ n ≤ 5×10⁴', 'Majority element always exists'],
    testCases: [
      { input: '3 2 3',         expected: '3', hidden: false },
      { input: '2 2 1 1 1 2 2', expected: '2', hidden: false },
      { input: '1',             expected: '1', hidden: true  },
      { input: '6 6 6 7 7',     expected: '6', hidden: true  },
    ],
    hints: [
      "Boyer-Moore Voting Algorithm runs in O(n) O(1).",
      'Keep a candidate and a count.',
      'If count drops to 0, change candidate.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int majorityElement(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        `,
      java: `class Solution {
    public int majorityElement(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var majorityElement = function(nums) {

};`,
      c: `int majorityElement(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    cout << sol.majorityElement(nums) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(Solution().majorityElement(nums))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().majorityElement(nums));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(majorityElement(nums));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[50001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    printf("%d\\n", majorityElement(nums, n));
    return 0;
}`,
    },
    aiContext: 'Majority Element — Boyer-Moore Voting O(n) O(1)',
  },

  // ── 10. Reverse Linked List ──────────────────────────────────────────────────
  {
    number: 10, title: 'Reverse Linked List', slug: 'reverse-linked-list', difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'], companies: ['Amazon', 'Microsoft', 'Apple'],
    acceptance: 73.4, premium: false,
    description: `Given the head of a singly linked list, reverse the list and return the reversed list.<br><br>Input: space-separated node values. Output: reversed space-separated values.`,
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '5 4 3 2 1' },
      { input: 'head = [1,2]',       output: '2 1' },
      { input: 'head = []',          output: '' },
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
      'Return prev at the end.',
    ],
    starter: {
      cpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {

    }
};`,
      python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        `,
      java: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 * }
 */
class Solution {
    public ListNode reverseList(ListNode head) {

    }
}`,
      javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var reverseList = function(head) {

};`,
      c: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 */
struct ListNode* reverseList(struct ListNode* head) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    int val; ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

__USER_CODE__

int main() {
    vector<int> vals; int x;
    while (cin >> x) vals.push_back(x);
    if (vals.empty()) { cout << endl; return 0; }
    ListNode* head = new ListNode(vals[0]);
    ListNode* cur = head;
    for (int i = 1; i < (int)vals.size(); i++) { cur->next = new ListNode(vals[i]); cur = cur->next; }
    Solution sol;
    ListNode* res = sol.reverseList(head);
    bool first = true;
    while (res) { if (!first) cout << " "; cout << res->val; res = res->next; first = false; }
    cout << endl;
    return 0;
}`,
      python: `from typing import Optional
import sys

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

__USER_CODE__

vals = list(map(int, sys.stdin.read().split()))
if not vals: print(''); exit()
head = ListNode(vals[0])
cur = head
for v in vals[1:]: cur.next = ListNode(v); cur = cur.next
res = Solution().reverseList(head)
out = []
while res: out.append(str(res.val)); res = res.next
print(' '.join(out))`,
      java: `import java.util.*;

class ListNode {
    int val; ListNode next;
    ListNode(int x) { val = x; }
}

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> vals = new ArrayList<>();
        while (sc.hasNextInt()) vals.add(sc.nextInt());
        if (vals.isEmpty()) { System.out.println(""); return; }
        ListNode head = new ListNode(vals.get(0));
        ListNode cur = head;
        for (int i = 1; i < vals.size(); i++) { cur.next = new ListNode(vals.get(i)); cur = cur.next; }
        ListNode res = new Solution().reverseList(head);
        StringBuilder sb = new StringBuilder();
        while (res != null) { if (sb.length() > 0) sb.append(" "); sb.append(res.val); res = res.next; }
        System.out.println(sb);
    }
}`,
      javascript: `const vals = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/).filter(Boolean).map(Number);

function ListNode(val, next) { this.val = val ?? 0; this.next = next ?? null; }

__USER_CODE__

if (!vals.length) { console.log(''); process.exit(0); }
let head = new ListNode(vals[0]);
let cur = head;
for (let i = 1; i < vals.length; i++) { cur.next = new ListNode(vals[i]); cur = cur.next; }
let res = reverseList(head);
const out = [];
while (res) { out.push(res.val); res = res.next; }
console.log(out.join(' '));`,
      c: `#include <stdio.h>
#include <stdlib.h>

struct ListNode { int val; struct ListNode *next; };

__USER_CODE__

int main() {
    int vals[5001], n = 0;
    while (scanf("%d", &vals[n]) == 1) n++;
    if (n == 0) { printf("\\n"); return 0; }
    struct ListNode *nodes = malloc(n * sizeof(struct ListNode));
    for (int i = 0; i < n; i++) { nodes[i].val = vals[i]; nodes[i].next = i+1 < n ? &nodes[i+1] : NULL; }
    struct ListNode *res = reverseList(&nodes[0]);
    int first = 1;
    while (res) { if (!first) printf(" "); printf("%d", res->val); res = res->next; first = 0; }
    printf("\\n"); free(nodes); return 0;
}`,
    },
    aiContext: 'Reverse Linked List — iterative three-pointer O(n)',
  },

  // ── PROBLEMS 11–20 ────────────────────────────────────────────────────────────


  // ── 11. Longest Substring Without Repeating Characters ──────────────────────
  {
    number: 11, title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-without-repeating-characters', difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Sliding Window'], companies: ['Google', 'Amazon', 'Facebook', 'Microsoft'],
    acceptance: 33.8, premium: false,
    description: `Given a string <code>s</code>, find the length of the <strong>longest substring</strong> without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: '"abc" has length 3' },
      { input: 's = "bbbbb"',    output: '1', explanation: '"b" has length 1' },
      { input: 's = "pwwkew"',   output: '3', explanation: '"wke" has length 3' },
    ],
    constraints: ['0 ≤ s.length ≤ 5×10⁴', 's consists of English letters, digits, symbols and spaces'],
    testCases: [
      { input: 'abcabcbb', expected: '3', hidden: false },
      { input: 'bbbbb',    expected: '1', hidden: false },
      { input: 'pwwkew',   expected: '3', hidden: false },
      { input: 'a',        expected: '1', hidden: true  },
      { input: 'dvdf',     expected: '3', hidden: true  },
    ],
    hints: [
      'Use a sliding window with two pointers.',
      'Track characters in the current window with a hash map.',
      'When a duplicate is found, move the left pointer past the previous occurrence.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {

    }
};`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        `,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {

    }
}`,
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {

};`,
      c: `int lengthOfLongestSubstring(char* s) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string s; getline(cin, s);
    Solution sol;
    cout << sol.lengthOfLongestSubstring(s) << endl;
    return 0;
}`,
      python: `import sys

__USER_CODE__

s = sys.stdin.read().strip()
print(Solution().lengthOfLongestSubstring(s))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        String s = new Scanner(System.in).nextLine().trim();
        System.out.println(new Solution().lengthOfLongestSubstring(s));
    }
}`,
      javascript: `const s = require('fs').readFileSync('/dev/stdin', 'utf8').trim();

__USER_CODE__

console.log(lengthOfLongestSubstring(s));`,
      c: `#include <stdio.h>
#include <string.h>

__USER_CODE__

int main() {
    char s[50001];
    fgets(s, sizeof(s), stdin);
    int n = strlen(s);
    if (s[n-1] == '\\n') s[--n] = '\\0';
    printf("%d\\n", lengthOfLongestSubstring(s));
    return 0;
}`,
    },
    aiContext: 'Longest Substring Without Repeating Characters — sliding window O(n)',
  },

  // ── 12. Coin Change ──────────────────────────────────────────────────────────
  {
    number: 12, title: 'Coin Change', slug: 'coin-change', difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', 'BFS'], companies: ['Amazon', 'Google', 'Microsoft'],
    acceptance: 41.3, premium: false,
    description: `You are given an integer array <code>coins</code> representing coins of different denominations and an integer <code>amount</code>. Return the fewest number of coins needed to make up that amount. Return <code>-1</code> if it cannot be made.<br><br>First line: space-separated coin values. Second line: amount.`,
    examples: [
      { input: 'coins = [1,5,10,25], amount = 41', output: '4',  explanation: '25+10+5+1' },
      { input: 'coins = [2], amount = 3',           output: '-1' },
      { input: 'coins = [1], amount = 0',           output: '0'  },
    ],
    constraints: ['1 ≤ coins.length ≤ 12', '1 ≤ coins[i] ≤ 2³¹-1', '0 ≤ amount ≤ 10⁴'],
    testCases: [
      { input: '1 5 10 25\n41', expected: '4',  hidden: false },
      { input: '2\n3',          expected: '-1', hidden: false },
      { input: '1\n0',          expected: '0',  hidden: false },
      { input: '1 2 5\n11',     expected: '3',  hidden: true  },
      { input: '186 419 83 408\n6249', expected: '20', hidden: true },
    ],
    hints: [
      'Define dp[i] = min coins needed to make amount i.',
      'Initialize dp[0] = 0, all others = infinity.',
      'For each amount i, try every coin: dp[i] = min(dp[i], dp[i-coin] + 1).',
    ],
    starter: {
      cpp: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {

    }
};`,
      python: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        `,
      java: `class Solution {
    public int coinChange(int[] coins, int amount) {

    }
}`,
      javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
var coinChange = function(coins, amount) {

};`,
      c: `int coinChange(int* coins, int coinsSize, int amount) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string line; getline(cin, line);
    istringstream ss(line);
    vector<int> coins; int x;
    while (ss >> x) coins.push_back(x);
    int amount; cin >> amount;
    Solution sol;
    cout << sol.coinChange(coins, amount) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

data = sys.stdin.read().split('\\n')
coins = list(map(int, data[0].split()))
amount = int(data[1].strip())
print(Solution().coinChange(coins, amount))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] coins = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        int amount = sc.nextInt();
        System.out.println(new Solution().coinChange(coins, amount));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const coins = lines[0].split(' ').map(Number);
const amount = parseInt(lines[1]);

__USER_CODE__

console.log(coinChange(coins, amount));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int coins[20], nc = 0, amount;
    char buf[500]; fgets(buf, sizeof(buf), stdin);
    char *p = buf;
    while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } coins[nc++] = strtol(p, &p, 10); }
    scanf("%d", &amount);
    printf("%d\\n", coinChange(coins, nc, amount));
    return 0;
}`,
    },
    aiContext: 'Coin Change — bottom-up DP O(n * amount)',
  },

  // ── 13. Number of Islands ────────────────────────────────────────────────────
  {
    number: 13, title: 'Number of Islands', slug: 'number-of-islands', difficulty: 'Medium',
    tags: ['Array', 'DFS', 'BFS', 'Union Find', 'Matrix'], companies: ['Amazon', 'Google', 'Facebook'],
    acceptance: 57.5, premium: false,
    description: `Given an <code>m x n</code> 2D binary grid where <code>'1'</code> is land and <code>'0'</code> is water, return the number of islands.<br><br>Each row of the grid is given as a string of 0s and 1s (no spaces).`,
    examples: [
      { input: '11110\n11010\n11000\n00000', output: '1' },
      { input: '11000\n11000\n00100\n00011', output: '3' },
    ],
    constraints: ['1 ≤ m, n ≤ 300', "grid[i][j] is '0' or '1'"],
    testCases: [
      { input: '11110\n11010\n11000\n00000', expected: '1', hidden: false },
      { input: '11000\n11000\n00100\n00011', expected: '3', hidden: false },
      { input: '1',                          expected: '1', hidden: true  },
      { input: '0',                          expected: '0', hidden: true  },
      { input: '111\n010\n111',              expected: '1', hidden: true  },
    ],
    hints: [
      'DFS/BFS from every unvisited land cell.',
      'Mark visited cells as water to avoid revisiting.',
      'Each DFS/BFS call from an unvisited cell counts as one island.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {

    }
};`,
      python: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        `,
      java: `class Solution {
    public int numIslands(char[][] grid) {

    }
}`,
      javascript: `/**
 * @param {character[][]} grid
 * @return {number}
 */
var numIslands = function(grid) {

};`,
      c: `int numIslands(char** grid, int gridSize, int* gridColSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<vector<char>> grid;
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        grid.push_back(vector<char>(line.begin(), line.end()));
    }
    Solution sol;
    cout << sol.numIslands(grid) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
grid = [list(line) for line in lines]
print(Solution().numIslands(grid))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<char[]> rows = new ArrayList<>();
        while (sc.hasNextLine()) {
            String l = sc.nextLine();
            if (!l.isEmpty()) rows.add(l.toCharArray());
        }
        char[][] grid = rows.toArray(new char[0][]);
        System.out.println(new Solution().numIslands(grid));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const grid = lines.map(l => l.split(''));

__USER_CODE__

console.log(numIslands(grid));`,
      c: `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

__USER_CODE__

int main() {
    char *grid[301]; char bufs[301][302]; int n = 0;
    while (scanf("%s", bufs[n]) == 1) { grid[n] = bufs[n]; n++; }
    int cols = strlen(grid[0]);
    int colSizes[301]; for (int i = 0; i < n; i++) colSizes[i] = cols;
    printf("%d\\n", numIslands(grid, n, colSizes));
    return 0;
}`,
    },
    aiContext: 'Number of Islands — DFS/BFS grid traversal O(m*n)',
  },

  // ── 14. 3Sum ─────────────────────────────────────────────────────────────────
  {
    number: 14, title: '3Sum', slug: 'three-sum', difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Sorting'], companies: ['Google', 'Amazon', 'Facebook'],
    acceptance: 32.5, premium: false,
    description: `Given an integer array <code>nums</code>, return all triplets <code>[nums[i], nums[j], nums[k]]</code> such that <code>i != j != k</code> and <code>nums[i] + nums[j] + nums[k] == 0</code>.<br><br>The solution set must not contain duplicate triplets. Print each triplet on a new line, space-separated.`,
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '-1 -1 2\n-1 0 1' },
      { input: 'nums = [0,1,1]',          output: ''     },
      { input: 'nums = [0,0,0]',          output: '0 0 0'},
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
      'Fix the first element and use two pointers for the remaining two.',
      'Skip duplicate values at each pointer position.',
    ],
    starter: {
      cpp: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        `,
      java: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {

};`,
      c: `int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    vector<vector<int>> res = sol.threeSum(nums);
    for (auto& t : res) cout << t[0] << " " << t[1] << " " << t[2] << "\\n";
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
result = Solution().threeSum(nums)
for t in result:
    print(*t)`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        List<List<Integer>> res = new Solution().threeSum(nums);
        for (List<Integer> t : res)
            System.out.println(t.get(0) + " " + t.get(1) + " " + t.get(2));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

const result = threeSum(nums);
for (const t of result) console.log(t.join(' '));`,
      c: `#include <stdio.h>
#include <stdlib.h>

__USER_CODE__

int main() {
    int nums[3001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    int returnSize; int *returnColSizes;
    int **res = threeSum(nums, n, &returnSize, &returnColSizes);
    for (int i = 0; i < returnSize; i++)
        printf("%d %d %d\\n", res[i][0], res[i][1], res[i][2]);
    return 0;
}`,
    },
    aiContext: '3Sum — sort + two pointers O(n²)',
  },

  // ── 15. Merge Intervals ──────────────────────────────────────────────────────
  {
    number: 15, title: 'Merge Intervals', slug: 'merge-intervals', difficulty: 'Medium',
    tags: ['Array', 'Sorting'], companies: ['Facebook', 'Google', 'Twitter'],
    acceptance: 45.8, premium: false,
    description: `Given an array of intervals <code>intervals</code> where <code>intervals[i] = [start, end]</code>, merge all overlapping intervals and return the result.<br><br>Input: each interval on its own line as two space-separated integers. Output: each merged interval on a new line.`,
    examples: [
      { input: '1 3\n2 6\n8 10\n15 18', output: '1 6\n8 10\n15 18' },
      { input: '1 4\n4 5',              output: '1 5'               },
    ],
    constraints: ['1 ≤ intervals.length ≤ 10⁴', 'intervals[i].length == 2', '0 ≤ start ≤ end ≤ 10⁴'],
    testCases: [
      { input: '1 3\n2 6\n8 10\n15 18', expected: '1 6\n8 10\n15 18', hidden: false },
      { input: '1 4\n4 5',              expected: '1 5',               hidden: false },
      { input: '1 4\n2 3',              expected: '1 4',               hidden: true  },
      { input: '1 2\n3 4\n5 6',         expected: '1 2\n3 4\n5 6',    hidden: true  },
    ],
    hints: [
      'Sort intervals by start time.',
      'If the current interval overlaps with the last merged interval, extend it.',
      'Otherwise push it as a new interval.',
    ],
    starter: {
      cpp: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {

    }
};`,
      python: `class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        `,
      java: `class Solution {
    public int[][] merge(int[][] intervals) {

    }
}`,
      javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
var merge = function(intervals) {

};`,
      c: `int** merge(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize, int** returnColumnSizes) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<vector<int>> intervals;
    int a, b;
    while (cin >> a >> b) intervals.push_back({a, b});
    Solution sol;
    auto res = sol.merge(intervals);
    for (auto& v : res) cout << v[0] << " " << v[1] << "\\n";
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
intervals = [list(map(int, l.split())) for l in lines]
for v in Solution().merge(intervals):
    print(*v)`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<int[]> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(new int[]{sc.nextInt(), sc.nextInt()});
        int[][] intervals = list.toArray(new int[0][]);
        for (int[] v : new Solution().merge(intervals))
            System.out.println(v[0] + " " + v[1]);
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const intervals = lines.map(l => l.split(' ').map(Number));

__USER_CODE__

for (const v of merge(intervals)) console.log(v[0] + ' ' + v[1]);`,
      c: `#include <stdio.h>
#include <stdlib.h>

__USER_CODE__

int main() {
    int arr[10001][2], n = 0;
    while (scanf("%d %d", &arr[n][0], &arr[n][1]) == 2) n++;
    int *ptrs[10001]; for (int i = 0; i < n; i++) ptrs[i] = arr[i];
    int colSizes[10001]; for (int i = 0; i < n; i++) colSizes[i] = 2;
    int retSize; int *retColSizes;
    int **res = merge((int**)ptrs, n, colSizes, &retSize, &retColSizes);
    for (int i = 0; i < retSize; i++) printf("%d %d\\n", res[i][0], res[i][1]);
    return 0;
}`,
    },
    aiContext: 'Merge Intervals — sort then linear scan O(n log n)',
  },

  // ── 16. Maximum Depth of Binary Tree ────────────────────────────────────────
  {
    number: 16, title: 'Maximum Depth of Binary Tree', slug: 'maximum-depth-of-binary-tree', difficulty: 'Easy',
    tags: ['Tree', 'DFS', 'BFS'], companies: ['LinkedIn', 'Amazon', 'Google'],
    acceptance: 73.9, premium: false,
    description: `Given a binary tree in level-order (space-separated, use <code>null</code> for missing nodes), return its maximum depth — the number of nodes along the longest path from root to leaf.`,
    examples: [
      { input: '3 9 20 null null 15 7', output: '3' },
      { input: '1 null 2',             output: '2' },
    ],
    constraints: ['0 ≤ number of nodes ≤ 10⁴', '-100 ≤ Node.val ≤ 100'],
    testCases: [
      { input: '3 9 20 null null 15 7', expected: '3', hidden: false },
      { input: '1 null 2',              expected: '2', hidden: false },
      { input: '1',                     expected: '1', hidden: true  },
      { input: 'null',                  expected: '0', hidden: true  },
      { input: '1 2 3 4 5',             expected: '3', hidden: true  },
    ],
    hints: [
      'Recursive DFS: depth = 1 + max(leftDepth, rightDepth).',
      'Base case: null node returns 0.',
      'Or use BFS and count levels.',
    ],
    starter: {
      cpp: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 * };
 */
class Solution {
public:
    int maxDepth(TreeNode* root) {

    }
};`,
      python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        `,
      java: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 * }
 */
class Solution {
    public int maxDepth(TreeNode root) {

    }
}`,
      javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
var maxDepth = function(root) {

};`,
      c: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */
int maxDepth(struct TreeNode* root) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* build(vector<string>& v, int i) {
    if (i >= (int)v.size() || v[i] == "null") return nullptr;
    TreeNode* n = new TreeNode(stoi(v[i]));
    n->left  = build(v, 2*i+1);
    n->right = build(v, 2*i+2);
    return n;
}

__USER_CODE__

int main() {
    vector<string> vals; string s;
    while (cin >> s) vals.push_back(s);
    TreeNode* root = vals.empty() || vals[0] == "null" ? nullptr : build(vals, 0);
    Solution sol;
    cout << sol.maxDepth(root) << endl;
    return 0;
}`,
      python: `from typing import Optional
from collections import deque
import sys

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def build(vals):
    if not vals or vals[0] == 'null': return None
    root = TreeNode(int(vals[0])); q = deque([root]); i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals) and vals[i] != 'null': node.left = TreeNode(int(vals[i])); q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] != 'null': node.right = TreeNode(int(vals[i])); q.append(node.right)
        i += 1
    return root

__USER_CODE__

vals = sys.stdin.read().split()
print(Solution().maxDepth(build(vals)))`,
      java: `import java.util.*;

class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

__USER_CODE__

public class Main {
    static TreeNode build(String[] v, int i) {
        if (i >= v.length || v[i].equals("null")) return null;
        TreeNode n = new TreeNode(Integer.parseInt(v[i]));
        n.left  = build(v, 2*i+1);
        n.right = build(v, 2*i+2);
        return n;
    }
    public static void main(String[] args) {
        String[] vals = new Scanner(System.in).useDelimiter("\\\\s+").tokens().toArray(String[]::new);
        TreeNode root = vals.length == 0 || vals[0].equals("null") ? null : build(vals, 0);
        System.out.println(new Solution().maxDepth(root));
    }
}`,
      javascript: `const vals = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/);

function TreeNode(val, left, right) { this.val = val ?? 0; this.left = left ?? null; this.right = right ?? null; }

function build(vals, i = 0) {
    if (i >= vals.length || vals[i] === 'null') return null;
    const n = new TreeNode(+vals[i]);
    n.left  = build(vals, 2*i+1);
    n.right = build(vals, 2*i+2);
    return n;
}

__USER_CODE__

const root = !vals.length || vals[0] === 'null' ? null : build(vals);
console.log(maxDepth(root));`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct TreeNode { int val; struct TreeNode *left, *right; };
struct TreeNode* newNode(int v) { struct TreeNode* n = malloc(sizeof(struct TreeNode)); n->val=v; n->left=n->right=NULL; return n; }

struct TreeNode* build(char toks[][20], int n, int i) {
    if (i >= n || strcmp(toks[i], "null") == 0) return NULL;
    struct TreeNode* node = newNode(atoi(toks[i]));
    node->left  = build(toks, n, 2*i+1);
    node->right = build(toks, n, 2*i+2);
    return node;
}

__USER_CODE__

int main() {
    char toks[10000][20]; int tc = 0;
    while (scanf("%s", toks[tc]) == 1) tc++;
    struct TreeNode* root = (tc == 0 || strcmp(toks[0], "null") == 0) ? NULL : build(toks, tc, 0);
    printf("%d\\n", maxDepth(root));
    return 0;
}`,
    },
    aiContext: 'Maximum Depth of Binary Tree — DFS recursion O(n)',
  },

  // ── 17. Validate Binary Search Tree ─────────────────────────────────────────
  {
    number: 17, title: 'Validate Binary Search Tree', slug: 'validate-binary-search-tree', difficulty: 'Medium',
    tags: ['Tree', 'DFS', 'Binary Search Tree'], companies: ['Amazon', 'Bloomberg', 'Facebook'],
    acceptance: 31.8, premium: false,
    description: `Given a binary tree in level-order (space-separated, use <code>null</code> for missing nodes), determine if it is a valid BST.<br><br>A valid BST: left subtree values are strictly less than root; right subtree values are strictly greater; both subtrees are also valid BSTs.`,
    examples: [
      { input: '2 1 3',               output: 'true'  },
      { input: '5 1 4 null null 3 6', output: 'false' },
    ],
    constraints: ['1 ≤ number of nodes ≤ 10⁴', '-2³¹ ≤ Node.val ≤ 2³¹-1'],
    testCases: [
      { input: '2 1 3',                 expected: 'true',  hidden: false },
      { input: '5 1 4 null null 3 6',   expected: 'false', hidden: false },
      { input: '1',                     expected: 'true',  hidden: true  },
      { input: '10 5 15 null null 6 20', expected: 'false', hidden: true },
    ],
    hints: [
      'Pass min and max bounds through the recursion.',
      'At each node: value must be strictly within (min, max).',
      'Update bounds: left child gets max=node.val, right child gets min=node.val.',
    ],
    starter: {
      cpp: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 * };
 */
class Solution {
public:
    bool isValidBST(TreeNode* root) {

    }
};`,
      python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isValidBST(self, root: Optional[TreeNode]) -> bool:
        `,
      java: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 * }
 */
class Solution {
    public boolean isValidBST(TreeNode root) {

    }
}`,
      javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {boolean}
 */
var isValidBST = function(root) {

};`,
      c: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */
bool isValidBST(struct TreeNode* root) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* build(vector<string>& v, int i) {
    if (i >= (int)v.size() || v[i] == "null") return nullptr;
    TreeNode* n = new TreeNode(stoi(v[i]));
    n->left  = build(v, 2*i+1);
    n->right = build(v, 2*i+2);
    return n;
}

__USER_CODE__

int main() {
    vector<string> vals; string s;
    while (cin >> s) vals.push_back(s);
    TreeNode* root = vals.empty() || vals[0] == "null" ? nullptr : build(vals, 0);
    Solution sol;
    cout << (sol.isValidBST(root) ? "true" : "false") << endl;
    return 0;
}`,
      python: `from typing import Optional
from collections import deque
import sys

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def build(vals):
    if not vals or vals[0] == 'null': return None
    root = TreeNode(int(vals[0])); q = deque([root]); i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals) and vals[i] != 'null': node.left = TreeNode(int(vals[i])); q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] != 'null': node.right = TreeNode(int(vals[i])); q.append(node.right)
        i += 1
    return root

__USER_CODE__

vals = sys.stdin.read().split()
print(str(Solution().isValidBST(build(vals))).lower())`,
      java: `import java.util.*;

class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

__USER_CODE__

public class Main {
    static TreeNode build(String[] v, int i) {
        if (i >= v.length || v[i].equals("null")) return null;
        TreeNode n = new TreeNode(Integer.parseInt(v[i]));
        n.left  = build(v, 2*i+1);
        n.right = build(v, 2*i+2);
        return n;
    }
    public static void main(String[] args) {
        String[] vals = new Scanner(System.in).useDelimiter("\\\\s+").tokens().toArray(String[]::new);
        TreeNode root = vals.length == 0 || vals[0].equals("null") ? null : build(vals, 0);
        System.out.println(new Solution().isValidBST(root));
    }
}`,
      javascript: `const vals = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/);

function TreeNode(val, left, right) { this.val = val ?? 0; this.left = left ?? null; this.right = right ?? null; }

function build(vals, i = 0) {
    if (i >= vals.length || vals[i] === 'null') return null;
    const n = new TreeNode(+vals[i]);
    n.left  = build(vals, 2*i+1);
    n.right = build(vals, 2*i+2);
    return n;
}

__USER_CODE__

const root = !vals.length || vals[0] === 'null' ? null : build(vals);
console.log(String(isValidBST(root)));`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

struct TreeNode { int val; struct TreeNode *left, *right; };
struct TreeNode* newNode(int v) { struct TreeNode* n = malloc(sizeof(struct TreeNode)); n->val=v; n->left=n->right=NULL; return n; }

struct TreeNode* build(char toks[][20], int n, int i) {
    if (i >= n || strcmp(toks[i], "null") == 0) return NULL;
    struct TreeNode* node = newNode(atoi(toks[i]));
    node->left  = build(toks, n, 2*i+1);
    node->right = build(toks, n, 2*i+2);
    return node;
}

__USER_CODE__

int main() {
    char toks[10000][20]; int tc = 0;
    while (scanf("%s", toks[tc]) == 1) tc++;
    struct TreeNode* root = (tc == 0 || strcmp(toks[0], "null") == 0) ? NULL : build(toks, tc, 0);
    printf("%s\\n", isValidBST(root) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Validate BST — DFS with min/max bounds O(n)',
  },

  // ── 18. House Robber ─────────────────────────────────────────────────────────
  {
    number: 18, title: 'House Robber', slug: 'house-robber', difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming'], companies: ['Airbnb', 'Amazon', 'Microsoft'],
    acceptance: 49.9, premium: false,
    description: `You are a robber. Adjacent houses have alarms — you cannot rob two adjacent houses. Given an integer array <code>nums</code> representing the money in each house, return the maximum amount you can rob.`,
    examples: [
      { input: 'nums = [1,2,3,1]',   output: '4',  explanation: 'Rob house 1 and 3: 1+3=4' },
      { input: 'nums = [2,7,9,3,1]', output: '12', explanation: 'Rob house 1, 3, 5: 2+9+1=12' },
    ],
    constraints: ['1 ≤ nums.length ≤ 100', '0 ≤ nums[i] ≤ 400'],
    testCases: [
      { input: '1 2 3 1',   expected: '4',  hidden: false },
      { input: '2 7 9 3 1', expected: '12', hidden: false },
      { input: '1',         expected: '1',  hidden: true  },
      { input: '2 1 1 2',   expected: '4',  hidden: true  },
      { input: '0 0 0',     expected: '0',  hidden: true  },
    ],
    hints: [
      'dp[i] = max amount robbing up to house i.',
      'dp[i] = max(dp[i-1], dp[i-2] + nums[i]).',
      'You only need two variables, not a full array.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int rob(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def rob(self, nums: List[int]) -> int:
        `,
      java: `class Solution {
    public int rob(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var rob = function(nums) {

};`,
      c: `int rob(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    cout << sol.rob(nums) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(Solution().rob(nums))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().rob(nums));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(rob(nums));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[101], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    printf("%d\\n", rob(nums, n));
    return 0;
}`,
    },
    aiContext: 'House Robber — DP with two variables O(n)',
  },

  // ── 19. Course Schedule ──────────────────────────────────────────────────────
  {
    number: 19, title: 'Course Schedule', slug: 'course-schedule', difficulty: 'Medium',
    tags: ['Graph', 'DFS', 'BFS', 'Topological Sort'], companies: ['Amazon', 'Airbnb', 'Google'],
    acceptance: 45.2, premium: false,
    description: `There are <code>numCourses</code> labeled <code>0</code> to <code>numCourses-1</code>. Given a list of prerequisites (each as <code>a b</code> meaning you must take <code>b</code> before <code>a</code>), return <code>true</code> if you can finish all courses.<br><br>First line: numCourses. Subsequent lines: prerequisite pairs.`,
    examples: [
      { input: '2\n1 0',      output: 'true',  explanation: 'Take course 0 then 1' },
      { input: '2\n1 0\n0 1', output: 'false', explanation: 'Cycle: 0→1→0' },
    ],
    constraints: ['1 ≤ numCourses ≤ 2000', '0 ≤ prerequisites.length ≤ 5000'],
    testCases: [
      { input: '2\n1 0',      expected: 'true',  hidden: false },
      { input: '2\n1 0\n0 1', expected: 'false', hidden: false },
      { input: '1',           expected: 'true',  hidden: true  },
      { input: '3\n0 1\n1 2\n2 0', expected: 'false', hidden: true },
    ],
    hints: [
      'Build an adjacency list and track in-degrees.',
      "Use Kahn's BFS topological sort.",
      'If all nodes are processed, no cycle exists.',
    ],
    starter: {
      cpp: `class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {

    }
};`,
      python: `class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        `,
      java: `class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {

    }
}`,
      javascript: `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @return {boolean}
 */
var canFinish = function(numCourses, prerequisites) {

};`,
      c: `bool canFinish(int numCourses, int** prerequisites, int prerequisitesSize, int* prerequisitesColSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    vector<vector<int>> prereqs;
    int a, b;
    while (cin >> a >> b) prereqs.push_back({a, b});
    Solution sol;
    cout << (sol.canFinish(n, prereqs) ? "true" : "false") << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
n = int(lines[0])
prereqs = [list(map(int, l.split())) for l in lines[1:] if l.strip()]
print(str(Solution().canFinish(n, prereqs)).lower())`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        List<int[]> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(new int[]{sc.nextInt(), sc.nextInt()});
        int[][] prereqs = list.toArray(new int[0][]);
        System.out.println(new Solution().canFinish(n, prereqs));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const n = parseInt(lines[0]);
const prereqs = lines.slice(1).filter(l => l.trim()).map(l => l.split(' ').map(Number));

__USER_CODE__

console.log(String(canFinish(n, prereqs)));`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

__USER_CODE__

int main() {
    int n; scanf("%d", &n);
    int arr[5001][2], m = 0;
    while (scanf("%d %d", &arr[m][0], &arr[m][1]) == 2) m++;
    int *ptrs[5001]; for (int i = 0; i < m; i++) ptrs[i] = arr[i];
    int colSizes[5001]; for (int i = 0; i < m; i++) colSizes[i] = 2;
    printf("%s\\n", canFinish(n, (int**)ptrs, m, colSizes) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Course Schedule — topological sort / cycle detection O(V+E)',
  },

  // ── 20. Longest Common Subsequence ──────────────────────────────────────────
  {
    number: 20, title: 'Longest Common Subsequence', slug: 'longest-common-subsequence', difficulty: 'Medium',
    tags: ['String', 'Dynamic Programming'], companies: ['Google', 'Amazon', 'Oracle'],
    acceptance: 56.7, premium: false,
    description: `Given two strings <code>text1</code> and <code>text2</code> (one per line), return the length of their longest common subsequence. Return 0 if there is no common subsequence.`,
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: '"ace" is the LCS' },
      { input: 'text1 = "abc", text2 = "abc"',   output: '3' },
      { input: 'text1 = "abc", text2 = "def"',   output: '0' },
    ],
    constraints: ['1 ≤ text1.length, text2.length ≤ 1000', 'Both strings consist of lowercase English letters'],
    testCases: [
      { input: 'abcde\nace', expected: '3', hidden: false },
      { input: 'abc\nabc',   expected: '3', hidden: false },
      { input: 'abc\ndef',   expected: '0', hidden: true  },
      { input: 'bl\nybyml',  expected: '2', hidden: true  },
    ],
    hints: [
      'Build a 2D DP table of size (m+1) x (n+1).',
      'If text1[i] == text2[j]: dp[i][j] = dp[i-1][j-1] + 1.',
      'Otherwise: dp[i][j] = max(dp[i-1][j], dp[i][j-1]).',
    ],
    starter: {
      cpp: `class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {

    }
};`,
      python: `class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        `,
      java: `class Solution {
    public int longestCommonSubsequence(String text1, String text2) {

    }
}`,
      javascript: `/**
 * @param {string} text1
 * @param {string} text2
 * @return {number}
 */
var longestCommonSubsequence = function(text1, text2) {

};`,
      c: `int longestCommonSubsequence(char* text1, char* text2) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string t1, t2;
    getline(cin, t1); getline(cin, t2);
    Solution sol;
    cout << sol.longestCommonSubsequence(t1, t2) << endl;
    return 0;
}`,
      python: `import sys

__USER_CODE__

data = sys.stdin.read().split('\\n')
t1 = data[0].strip(); t2 = data[1].strip()
print(Solution().longestCommonSubsequence(t1, t2))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String t1 = sc.nextLine().trim(), t2 = sc.nextLine().trim();
        System.out.println(new Solution().longestCommonSubsequence(t1, t2));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const t1 = lines[0].trim(), t2 = lines[1].trim();

__USER_CODE__

console.log(longestCommonSubsequence(t1, t2));`,
      c: `#include <stdio.h>
#include <string.h>

__USER_CODE__

int main() {
    char t1[1001], t2[1001];
    fgets(t1, sizeof(t1), stdin); fgets(t2, sizeof(t2), stdin);
    int n1 = strlen(t1), n2 = strlen(t2);
    if (t1[n1-1] == '\\n') t1[--n1] = '\\0';
    if (t2[n2-1] == '\\n') t2[--n2] = '\\0';
    printf("%d\\n", longestCommonSubsequence(t1, t2));
    return 0;
}`,
    },
    aiContext: 'Longest Common Subsequence — 2D DP O(m*n)',
  },

// ── PROBLEMS 21–30 ────────────────────────────────────────────────────────────
// Each problem has:
//   starter     → what the user sees in the editor (function signature only)
//   codeWrapper → full runnable code sent to Judge0 (__USER_CODE__ = user's class)

  // ── 21. Trapping Rain Water ──────────────────────────────────────────────────
  {
    number: 21, title: 'Trapping Rain Water', slug: 'trapping-rain-water', difficulty: 'Hard',
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    companies: ['Amazon', 'Google', 'Goldman Sachs', 'Facebook'], acceptance: 58.1, premium: false,
    description: `Given <code>n</code> non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.`,
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: '6 units of water trapped' },
      { input: 'height = [4,2,0,3,2,5]',              output: '9' },
    ],
    constraints: ['n == height.length', '1 ≤ n ≤ 2×10⁴', '0 ≤ height[i] ≤ 10⁵'],
    testCases: [
      { input: '0 1 0 2 1 0 1 3 2 1 2 1', expected: '6',  hidden: false },
      { input: '4 2 0 3 2 5',             expected: '9',  hidden: false },
      { input: '1 0 1',                   expected: '1',  hidden: true  },
      { input: '3 0 0 2 0 4',             expected: '10', hidden: true  },
    ],
    hints: [
      'Two-pointer approach: maintain lo and hi pointers.',
      'Water at index i = min(maxLeft, maxRight) - height[i].',
      'Advance the pointer with the smaller max height.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int trap(vector<int>& height) {

    }
};`,
      python: `class Solution:
    def trap(self, height: List[int]) -> int:
        `,
      java: `class Solution {
    public int trap(int[] height) {

    }
}`,
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {

};`,
      c: `int trap(int* height, int heightSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> height; int x;
    while (cin >> x) height.push_back(x);
    Solution sol;
    cout << sol.trap(height) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

height = list(map(int, sys.stdin.read().split()))
print(Solution().trap(height))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] height = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().trap(height));
    }
}`,
      javascript: `const height = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(trap(height));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int h[20001], n = 0;
    while (scanf("%d", &h[n]) == 1) n++;
    printf("%d\\n", trap(h, n));
    return 0;
}`,
    },
    aiContext: 'Trapping Rain Water — two pointers O(n)',
  },

  // ── 22. Unique Paths ─────────────────────────────────────────────────────────
  {
    number: 22, title: 'Unique Paths', slug: 'unique-paths', difficulty: 'Medium',
    tags: ['Math', 'Dynamic Programming', 'Combinatorics'],
    companies: ['Amazon', 'Goldman Sachs', 'Bloomberg'], acceptance: 62.5, premium: false,
    description: `A robot starts at the top-left corner of an <code>m x n</code> grid and wants to reach the bottom-right corner. It can only move right or down. How many unique paths are there?`,
    examples: [
      { input: 'm = 3, n = 7', output: '28' },
      { input: 'm = 3, n = 2', output: '3'  },
    ],
    constraints: ['1 ≤ m, n ≤ 100'],
    testCases: [
      { input: '3 7', expected: '28', hidden: false },
      { input: '3 2', expected: '3',  hidden: false },
      { input: '1 1', expected: '1',  hidden: true  },
      { input: '7 3', expected: '28', hidden: true  },
      { input: '3 3', expected: '6',  hidden: true  },
    ],
    hints: [
      'dp[i][j] = dp[i-1][j] + dp[i][j-1].',
      'First row and first column are all 1s.',
      'Can reduce to a 1D DP array.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int uniquePaths(int m, int n) {

    }
};`,
      python: `class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        `,
      java: `class Solution {
    public int uniquePaths(int m, int n) {

    }
}`,
      javascript: `/**
 * @param {number} m
 * @param {number} n
 * @return {number}
 */
var uniquePaths = function(m, n) {

};`,
      c: `int uniquePaths(int m, int n) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int m, n; cin >> m >> n;
    Solution sol;
    cout << sol.uniquePaths(m, n) << endl;
    return 0;
}`,
      python: `import sys

__USER_CODE__

m, n = map(int, sys.stdin.read().split())
print(Solution().uniquePaths(m, n))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int m = sc.nextInt(), n = sc.nextInt();
        System.out.println(new Solution().uniquePaths(m, n));
    }
}`,
      javascript: `const [m, n] = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(uniquePaths(m, n));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int m, n; scanf("%d %d", &m, &n);
    printf("%d\\n", uniquePaths(m, n));
    return 0;
}`,
    },
    aiContext: 'Unique Paths — 1D DP O(m*n)',
  },

  // ── 23. Jump Game ────────────────────────────────────────────────────────────
  {
    number: 23, title: 'Jump Game', slug: 'jump-game', difficulty: 'Medium',
    tags: ['Array', 'Greedy'], companies: ['Amazon', 'Microsoft', 'Apple'],
    acceptance: 38.4, premium: false,
    description: `You are given an integer array <code>nums</code> where <code>nums[i]</code> is the maximum jump length from index <code>i</code>. Return <code>true</code> if you can reach the last index, <code>false</code> otherwise.`,
    examples: [
      { input: 'nums = [2,3,1,1,4]', output: 'true',  explanation: 'Jump 1 then 4' },
      { input: 'nums = [3,2,1,0,4]', output: 'false', explanation: 'Always stuck at index 3' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁴', '0 ≤ nums[i] ≤ 10⁵'],
    testCases: [
      { input: '2 3 1 1 4', expected: 'true',  hidden: false },
      { input: '3 2 1 0 4', expected: 'false', hidden: false },
      { input: '0',         expected: 'true',  hidden: true  },
      { input: '2 0 0',     expected: 'true',  hidden: true  },
      { input: '1 0 0',     expected: 'false', hidden: true  },
    ],
    hints: [
      'Track the furthest reachable index.',
      'If current index > maxReach, return false.',
      'Update maxReach = max(maxReach, i + nums[i]).',
    ],
    starter: {
      cpp: `class Solution {
public:
    bool canJump(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def canJump(self, nums: List[int]) -> bool:
        `,
      java: `class Solution {
    public boolean canJump(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var canJump = function(nums) {

};`,
      c: `bool canJump(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    cout << (sol.canJump(nums) ? "true" : "false") << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(str(Solution().canJump(nums)).lower())`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().canJump(nums));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(String(canJump(nums)));`,
      c: `#include <stdio.h>
#include <stdbool.h>

__USER_CODE__

int main() {
    int nums[10001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    printf("%s\\n", canJump(nums, n) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Jump Game — greedy max reach O(n)',
  },

  // ── 24. Search in Rotated Sorted Array ──────────────────────────────────────
  {
    number: 24, title: 'Search in Rotated Sorted Array', slug: 'search-in-rotated-sorted-array', difficulty: 'Medium',
    tags: ['Array', 'Binary Search'], companies: ['Facebook', 'LinkedIn', 'Amazon'],
    acceptance: 38.5, premium: false,
    description: `Given a rotated sorted array of distinct integers and a target, return the index of target or <code>-1</code> if not found. Must be <code>O(log n)</code>.<br><br>First line: space-separated array. Second line: target.`,
    examples: [
      { input: '4 5 6 7 0 1 2\n0', output: '4' },
      { input: '4 5 6 7 0 1 2\n3', output: '-1' },
      { input: '1\n0',             output: '-1' },
    ],
    constraints: ['1 ≤ n ≤ 5000', 'All values are unique', '-10⁴ ≤ nums[i], target ≤ 10⁴'],
    testCases: [
      { input: '4 5 6 7 0 1 2\n0', expected: '4',  hidden: false },
      { input: '4 5 6 7 0 1 2\n3', expected: '-1', hidden: false },
      { input: '1\n0',             expected: '-1', hidden: false },
      { input: '3 1\n1',           expected: '1',  hidden: true  },
      { input: '5 1 3\n3',         expected: '2',  hidden: true  },
    ],
    hints: [
      'Use modified binary search.',
      'At each step determine which half is sorted.',
      'Check if target lies in the sorted half, then narrow accordingly.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {

    }
};`,
      python: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        `,
      java: `class Solution {
    public int search(int[] nums, int target) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {

};`,
      c: `int search(int* nums, int numsSize, int target) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string line; getline(cin, line);
    istringstream ss(line);
    vector<int> nums; int x;
    while (ss >> x) nums.push_back(x);
    int target; cin >> target;
    Solution sol;
    cout << sol.search(nums, target) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

data = sys.stdin.read().split('\\n')
nums = list(map(int, data[0].split()))
target = int(data[1].strip())
print(Solution().search(nums, target))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        int target = sc.nextInt();
        System.out.println(new Solution().search(nums, target));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const nums = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);

__USER_CODE__

console.log(search(nums, target));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[5001], n = 0, target;
    char buf[200000]; fgets(buf, sizeof(buf), stdin);
    char *p = buf;
    while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } nums[n++] = strtol(p, &p, 10); }
    scanf("%d", &target);
    printf("%d\\n", search(nums, n, target));
    return 0;
}`,
    },
    aiContext: 'Search in Rotated Sorted Array — modified binary search O(log n)',
  },

  // ── 25. Longest Increasing Subsequence ──────────────────────────────────────
  {
    number: 25, title: 'Longest Increasing Subsequence', slug: 'longest-increasing-subsequence', difficulty: 'Medium',
    tags: ['Array', 'Binary Search', 'Dynamic Programming'],
    companies: ['Amazon', 'Microsoft', 'Google'], acceptance: 54.6, premium: false,
    description: `Given an integer array <code>nums</code>, return the length of the longest strictly increasing subsequence.`,
    examples: [
      { input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', explanation: '[2,3,7,101]' },
      { input: 'nums = [0,1,0,3,2,3]',          output: '4' },
      { input: 'nums = [7,7,7,7,7,7,7]',         output: '1' },
    ],
    constraints: ['1 ≤ nums.length ≤ 2500', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    testCases: [
      { input: '10 9 2 5 3 7 101 18', expected: '4', hidden: false },
      { input: '0 1 0 3 2 3',         expected: '4', hidden: false },
      { input: '7 7 7 7 7',            expected: '1', hidden: false },
      { input: '1',                    expected: '1', hidden: true  },
      { input: '1 2 3 4 5',            expected: '5', hidden: true  },
    ],
    hints: [
      'O(n²) DP: dp[i] = max(dp[j]+1) for all j < i where nums[j] < nums[i].',
      'O(n log n): maintain a "tails" array with patience sorting.',
      'Binary search for the right position to place each element.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        `,
      java: `class Solution {
    public int lengthOfLIS(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var lengthOfLIS = function(nums) {

};`,
      c: `int lengthOfLIS(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    cout << sol.lengthOfLIS(nums) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(Solution().lengthOfLIS(nums))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().lengthOfLIS(nums));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(lengthOfLIS(nums));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[2501], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    printf("%d\\n", lengthOfLIS(nums, n));
    return 0;
}`,
    },
    aiContext: 'Longest Increasing Subsequence — patience sort O(n log n)',
  },

  // ── 26. Word Break ───────────────────────────────────────────────────────────
  {
    number: 26, title: 'Word Break', slug: 'word-break', difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Dynamic Programming', 'Trie', 'Memoization'],
    companies: ['Amazon', 'Google', 'Facebook'], acceptance: 45.5, premium: false,
    description: `Given a string <code>s</code> and a dictionary of strings <code>wordDict</code>, return <code>true</code> if <code>s</code> can be segmented into a space-separated sequence of one or more dictionary words.<br><br>First line: string s. Second line: space-separated dictionary words.`,
    examples: [
      { input: 'leetcode\nleet code',            output: 'true',  explanation: '"leetcode" = "leet" + "code"' },
      { input: 'applepenapple\napple pen',        output: 'true'  },
      { input: 'catsandog\ncats dog sand and cat', output: 'false' },
    ],
    constraints: ['1 ≤ s.length ≤ 300', '1 ≤ wordDict.length ≤ 1000', '1 ≤ wordDict[i].length ≤ 20'],
    testCases: [
      { input: 'leetcode\nleet code',             expected: 'true',  hidden: false },
      { input: 'applepenapple\napple pen',         expected: 'true',  hidden: false },
      { input: 'catsandog\ncats dog sand and cat', expected: 'false', hidden: false },
      { input: 'a\na',                             expected: 'true',  hidden: true  },
      { input: 'ab\na b',                          expected: 'true',  hidden: true  },
    ],
    hints: [
      'dp[i] = true if s[:i] can be segmented.',
      'For each i, check all j < i where dp[j] is true and s[j:i] is in the dictionary.',
      'Use a set for O(1) word lookup.',
    ],
    starter: {
      cpp: `class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {

    }
};`,
      python: `class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        `,
      java: `class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {

    }
}`,
      javascript: `/**
 * @param {string} s
 * @param {string[]} wordDict
 * @return {boolean}
 */
var wordBreak = function(s, wordDict) {

};`,
      c: `bool wordBreak(char* s, char** wordDict, int wordDictSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string s; getline(cin, s);
    string dictLine; getline(cin, dictLine);
    istringstream ss(dictLine);
    vector<string> wordDict; string w;
    while (ss >> w) wordDict.push_back(w);
    Solution sol;
    cout << (sol.wordBreak(s, wordDict) ? "true" : "false") << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().split('\\n')
s = lines[0].strip()
wordDict = lines[1].strip().split()
print(str(Solution().wordBreak(s, wordDict)).lower())`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        List<String> wordDict = Arrays.asList(sc.nextLine().trim().split(" "));
        System.out.println(new Solution().wordBreak(s, wordDict));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const s = lines[0].trim();
const wordDict = lines[1].trim().split(' ');

__USER_CODE__

console.log(String(wordBreak(s, wordDict)));`,
      c: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

__USER_CODE__

int main() {
    char s[301]; scanf("%s", s);
    char words[1001][21]; int wc = 0;
    while (scanf("%s", words[wc]) == 1) wc++;
    char *ptrs[1001]; for (int i = 0; i < wc; i++) ptrs[i] = words[i];
    printf("%s\\n", wordBreak(s, ptrs, wc) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Word Break — DP with hash set O(n²)',
  },

  // ── 27. Diameter of Binary Tree ──────────────────────────────────────────────
  {
    number: 27, title: 'Diameter of Binary Tree', slug: 'diameter-of-binary-tree', difficulty: 'Easy',
    tags: ['Tree', 'DFS'], companies: ['Facebook', 'Amazon', 'Google'],
    acceptance: 57.8, premium: false,
    description: `Given a binary tree in level-order (space-separated, use <code>null</code> for missing nodes), return the length of the diameter.<br><br>The diameter is the length of the longest path between any two nodes (may or may not pass through root). Length = number of edges.`,
    examples: [
      { input: '1 2 3 4 5',       output: '3', explanation: 'Path [4,2,1,3] has length 3' },
      { input: '1 2',             output: '1' },
    ],
    constraints: ['1 ≤ number of nodes ≤ 10⁴', '-100 ≤ Node.val ≤ 100'],
    testCases: [
      { input: '1 2 3 4 5',         expected: '3', hidden: false },
      { input: '1 2',               expected: '1', hidden: false },
      { input: '1',                 expected: '0', hidden: true  },
      { input: '1 2 null 3 null 4', expected: '3', hidden: true  },
    ],
    hints: [
      'For each node, the diameter through it = leftHeight + rightHeight.',
      'Track the global maximum during DFS.',
      'The recursive function should return height, not diameter.',
    ],
    starter: {
      cpp: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 * };
 */
class Solution {
public:
    int diameterOfBinaryTree(TreeNode* root) {

    }
};`,
      python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        `,
      java: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 * }
 */
class Solution {
    public int diameterOfBinaryTree(TreeNode root) {

    }
}`,
      javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number}
 */
var diameterOfBinaryTree = function(root) {

};`,
      c: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */
int diameterOfBinaryTree(struct TreeNode* root) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* build(vector<string>& v, int i) {
    if (i >= (int)v.size() || v[i] == "null") return nullptr;
    TreeNode* n = new TreeNode(stoi(v[i]));
    n->left  = build(v, 2*i+1);
    n->right = build(v, 2*i+2);
    return n;
}

__USER_CODE__

int main() {
    vector<string> vals; string s;
    while (cin >> s) vals.push_back(s);
    TreeNode* root = vals.empty() || vals[0] == "null" ? nullptr : build(vals, 0);
    Solution sol;
    cout << sol.diameterOfBinaryTree(root) << endl;
    return 0;
}`,
      python: `from typing import Optional
from collections import deque
import sys

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def build(vals):
    if not vals or vals[0] == 'null': return None
    root = TreeNode(int(vals[0])); q = deque([root]); i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals) and vals[i] != 'null': node.left = TreeNode(int(vals[i])); q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] != 'null': node.right = TreeNode(int(vals[i])); q.append(node.right)
        i += 1
    return root

__USER_CODE__

vals = sys.stdin.read().split()
print(Solution().diameterOfBinaryTree(build(vals)))`,
      java: `import java.util.*;

class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

__USER_CODE__

public class Main {
    static TreeNode build(String[] v, int i) {
        if (i >= v.length || v[i].equals("null")) return null;
        TreeNode n = new TreeNode(Integer.parseInt(v[i]));
        n.left  = build(v, 2*i+1);
        n.right = build(v, 2*i+2);
        return n;
    }
    public static void main(String[] args) {
        String[] vals = new Scanner(System.in).useDelimiter("\\\\s+").tokens().toArray(String[]::new);
        TreeNode root = vals.length == 0 || vals[0].equals("null") ? null : build(vals, 0);
        System.out.println(new Solution().diameterOfBinaryTree(root));
    }
}`,
      javascript: `const vals = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/);

function TreeNode(val, left, right) { this.val = val ?? 0; this.left = left ?? null; this.right = right ?? null; }

function build(vals, i = 0) {
    if (i >= vals.length || vals[i] === 'null') return null;
    const n = new TreeNode(+vals[i]);
    n.left  = build(vals, 2*i+1);
    n.right = build(vals, 2*i+2);
    return n;
}

__USER_CODE__

const root = !vals.length || vals[0] === 'null' ? null : build(vals);
console.log(diameterOfBinaryTree(root));`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct TreeNode { int val; struct TreeNode *left, *right; };
struct TreeNode* newNode(int v) { struct TreeNode* n = malloc(sizeof(struct TreeNode)); n->val=v; n->left=n->right=NULL; return n; }

struct TreeNode* build(char toks[][20], int n, int i) {
    if (i >= n || strcmp(toks[i], "null") == 0) return NULL;
    struct TreeNode* node = newNode(atoi(toks[i]));
    node->left  = build(toks, n, 2*i+1);
    node->right = build(toks, n, 2*i+2);
    return node;
}

__USER_CODE__

int main() {
    char toks[10000][20]; int tc = 0;
    while (scanf("%s", toks[tc]) == 1) tc++;
    struct TreeNode* root = (tc == 0 || strcmp(toks[0], "null") == 0) ? NULL : build(toks, tc, 0);
    printf("%d\\n", diameterOfBinaryTree(root));
    return 0;
}`,
    },
    aiContext: 'Diameter of Binary Tree — DFS tracking global max O(n)',
  },

  // ── 28. Product of Array Except Self ────────────────────────────────────────
  {
    number: 28, title: 'Product of Array Except Self', slug: 'product-of-array-except-self', difficulty: 'Medium',
    tags: ['Array', 'Prefix Sum'], companies: ['Amazon', 'Facebook', 'Microsoft'],
    acceptance: 64.3, premium: false,
    description: `Given an integer array <code>nums</code>, return an array <code>answer</code> such that <code>answer[i]</code> equals the product of all elements except <code>nums[i]</code>.<br><br>Must run in <code>O(n)</code> without using the division operator. Print result space-separated.`,
    examples: [
      { input: 'nums = [1,2,3,4]',     output: '24 12 8 6' },
      { input: 'nums = [-1,1,0,-3,3]', output: '0 0 9 0 0' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁵', '-30 ≤ nums[i] ≤ 30'],
    testCases: [
      { input: '1 2 3 4',     expected: '24 12 8 6',  hidden: false },
      { input: '-1 1 0 -3 3', expected: '0 0 9 0 0',  hidden: false },
      { input: '2 3',         expected: '3 2',         hidden: true  },
      { input: '1 0 0 1',     expected: '0 0 0 0',     hidden: true  },
    ],
    hints: [
      'Build prefix product array from the left.',
      'Build suffix product array from the right.',
      'answer[i] = prefix[i] * suffix[i].',
    ],
    starter: {
      cpp: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        `,
      java: `class Solution {
    public int[] productExceptSelf(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
var productExceptSelf = function(nums) {

};`,
      c: `int* productExceptSelf(int* nums, int numsSize, int* returnSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    vector<int> res = sol.productExceptSelf(nums);
    for (int i = 0; i < (int)res.size(); i++) cout << (i ? " " : "") << res[i];
    cout << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(*Solution().productExceptSelf(nums))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        int[] res = new Solution().productExceptSelf(nums);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < res.length; i++) sb.append(i > 0 ? " " : "").append(res[i]);
        System.out.println(sb);
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(productExceptSelf(nums).join(' '));`,
      c: `#include <stdio.h>
#include <stdlib.h>

__USER_CODE__

int main() {
    int nums[100001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    int retSize;
    int* res = productExceptSelf(nums, n, &retSize);
    for (int i = 0; i < retSize; i++) printf("%s%d", i ? " " : "", res[i]);
    printf("\\n"); free(res);
    return 0;
}`,
    },
    aiContext: 'Product of Array Except Self — prefix/suffix pass O(n)',
  },

  // ── 29. Rotate Image ─────────────────────────────────────────────────────────
  {
    number: 29, title: 'Rotate Image', slug: 'rotate-image', difficulty: 'Medium',
    tags: ['Array', 'Math', 'Matrix'], companies: ['Amazon', 'Microsoft', 'Apple'],
    acceptance: 72.9, premium: false,
    description: `Given an <code>n x n</code> 2D matrix, rotate it 90 degrees clockwise in-place.<br><br>Input: n rows of n space-separated integers. Output: rotated matrix.`,
    examples: [
      { input: '1 2 3\n4 5 6\n7 8 9',          output: '7 4 1\n8 5 2\n9 6 3' },
      { input: '5 1 9 11\n2 4 8 10\n13 3 6 7\n15 14 12 16', output: '15 13 2 5\n14 3 4 1\n12 6 8 9\n16 7 10 11' },
    ],
    constraints: ['n == matrix.length == matrix[i].length', '1 ≤ n ≤ 20', '-1000 ≤ matrix[i][j] ≤ 1000'],
    testCases: [
      { input: '1 2 3\n4 5 6\n7 8 9',          expected: '7 4 1\n8 5 2\n9 6 3',                             hidden: false },
      { input: '5 1 9 11\n2 4 8 10\n13 3 6 7\n15 14 12 16', expected: '15 13 2 5\n14 3 4 1\n12 6 8 9\n16 7 10 11', hidden: false },
      { input: '1',                             expected: '1',                                                hidden: true  },
    ],
    hints: [
      'Transpose the matrix first (swap matrix[i][j] and matrix[j][i]).',
      'Then reverse each row.',
      'This achieves a 90° clockwise rotation in-place.',
    ],
    starter: {
      cpp: `class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {

    }
};`,
      python: `class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        """
        Do not return anything, modify matrix in-place instead.
        """
        `,
      java: `class Solution {
    public void rotate(int[][] matrix) {

    }
}`,
      javascript: `/**
 * @param {number[][]} matrix
 * @return {void} Do not return anything, modify matrix in-place instead.
 */
var rotate = function(matrix) {

};`,
      c: `void rotate(int** matrix, int matrixSize, int* matrixColSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<vector<int>> matrix; string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        istringstream ss(line); vector<int> row; int x;
        while (ss >> x) row.push_back(x);
        matrix.push_back(row);
    }
    Solution sol; sol.rotate(matrix);
    for (auto& row : matrix) { for (int i = 0; i < (int)row.size(); i++) cout << (i ? " " : "") << row[i]; cout << "\\n"; }
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
matrix = [list(map(int, l.split())) for l in lines]
Solution().rotate(matrix)
for row in matrix: print(*row)`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<int[]> rows = new ArrayList<>();
        while (sc.hasNextLine()) {
            String l = sc.nextLine().trim(); if (l.isEmpty()) continue;
            rows.add(Arrays.stream(l.split(" ")).mapToInt(Integer::parseInt).toArray());
        }
        int[][] m = rows.toArray(new int[0][]);
        new Solution().rotate(m);
        for (int[] row : m) { StringBuilder sb = new StringBuilder(); for (int i=0;i<row.length;i++) sb.append(i>0?" ":"").append(row[i]); System.out.println(sb); }
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const matrix = lines.map(l => l.split(' ').map(Number));

__USER_CODE__

rotate(matrix);
for (const row of matrix) console.log(row.join(' '));`,
      c: `#include <stdio.h>
#include <string.h>

__USER_CODE__

int main() {
    int m[21][21], n = 0; char buf[500];
    while (fgets(buf, sizeof(buf), stdin)) {
        if (buf[0] == '\\n') continue;
        char *p = buf; int j = 0;
        while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } m[n][j++] = strtol(p, &p, 10); }
        n++;
    }
    int *ptrs[21]; int colSizes[21];
    for (int i = 0; i < n; i++) { ptrs[i] = m[i]; colSizes[i] = n; }
    rotate((int**)ptrs, n, colSizes);
    for (int i = 0; i < n; i++) { for (int j = 0; j < n; j++) printf("%s%d", j ? " " : "", m[i][j]); printf("\\n"); }
    return 0;
}`,
    },
    aiContext: 'Rotate Image — transpose + reverse rows O(n²)',
  },

  // ── 30. Palindrome Number ────────────────────────────────────────────────────
  {
    number: 30, title: 'Palindrome Number', slug: 'palindrome-number', difficulty: 'Easy',
    tags: ['Math'], companies: ['Amazon', 'Google'],
    acceptance: 52.9, premium: false,
    description: `Given an integer <code>x</code>, return <code>true</code> if <code>x</code> is a palindrome, and <code>false</code> otherwise.<br><br>Negative numbers and numbers ending in 0 (except 0 itself) are not palindromes.`,
    examples: [
      { input: 'x = 121',  output: 'true',  explanation: 'Reads the same left to right' },
      { input: 'x = -121', output: 'false', explanation: 'Negative number' },
      { input: 'x = 10',   output: 'false', explanation: 'Reads 01 from right to left' },
    ],
    constraints: ['-2³¹ ≤ x ≤ 2³¹-1'],
    testCases: [
      { input: '121',  expected: 'true',  hidden: false },
      { input: '-121', expected: 'false', hidden: false },
      { input: '10',   expected: 'false', hidden: false },
      { input: '0',    expected: 'true',  hidden: true  },
      { input: '1221', expected: 'true',  hidden: true  },
    ],
    hints: [
      'Negative numbers are never palindromes.',
      'Numbers ending in 0 (except 0) are not palindromes.',
      'Reverse only half the number to avoid overflow.',
    ],
    starter: {
      cpp: `class Solution {
public:
    bool isPalindrome(int x) {

    }
};`,
      python: `class Solution:
    def isPalindrome(self, x: int) -> bool:
        `,
      java: `class Solution {
    public boolean isPalindrome(int x) {

    }
}`,
      javascript: `/**
 * @param {number} x
 * @return {boolean}
 */
var isPalindrome = function(x) {

};`,
      c: `bool isPalindrome(int x) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int x; cin >> x;
    Solution sol;
    cout << (sol.isPalindrome(x) ? "true" : "false") << endl;
    return 0;
}`,
      python: `import sys

__USER_CODE__

x = int(sys.stdin.read().strip())
print(str(Solution().isPalindrome(x)).lower())`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        int x = new Scanner(System.in).nextInt();
        System.out.println(new Solution().isPalindrome(x));
    }
}`,
      javascript: `const x = parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());

__USER_CODE__

console.log(String(isPalindrome(x)));`,
      c: `#include <stdio.h>
#include <stdbool.h>

__USER_CODE__

int main() {
    int x; scanf("%d", &x);
    printf("%s\\n", isPalindrome(x) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Palindrome Number — reverse half O(log n)',
  },


  // ── PROBLEMS 31–40 ────────────────────────────────────────────────────────────
// Each problem has:
//   starter     → what the user sees in the editor (function signature only)
//   codeWrapper → full runnable code sent to Judge0 (__USER_CODE__ = user's class)

  // ── 31. Linked List Cycle ────────────────────────────────────────────────────
  {
    number: 31, title: 'Linked List Cycle', slug: 'linked-list-cycle', difficulty: 'Easy',
    tags: ['Hash Table', 'Linked List', 'Two Pointers'],
    companies: ['Amazon', 'Bloomberg', 'Yahoo'], acceptance: 45.8, premium: false,
    description: `Given a linked list as space-separated integers followed by a cycle position (last line, 0-indexed; -1 means no cycle), return <code>true</code> if there is a cycle, <code>false</code> otherwise.`,
    examples: [
      { input: '3 2 0 -4\n1', output: 'true',  explanation: 'Tail connects to node at index 1' },
      { input: '1 2\n0',      output: 'true'  },
      { input: '1\n-1',       output: 'false' },
    ],
    constraints: ['0 ≤ n ≤ 10⁴', '-10⁵ ≤ Node.val ≤ 10⁵'],
    testCases: [
      { input: '3 2 0 -4\n1', expected: 'true',  hidden: false },
      { input: '1 2\n0',      expected: 'true',  hidden: false },
      { input: '1\n-1',       expected: 'false', hidden: false },
      { input: '1 2 3\n-1',   expected: 'false', hidden: true  },
      { input: '1 2 3\n2',    expected: 'true',  hidden: true  },
    ],
    hints: [
      "Use Floyd's cycle detection (tortoise and hare).",
      'Slow pointer moves 1 step, fast pointer moves 2 steps.',
      'If they ever meet, a cycle exists.',
    ],
    starter: {
      cpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(nullptr) {}
 * };
 */
class Solution {
public:
    bool hasCycle(ListNode *head) {

    }
};`,
      python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, x):
#         self.val = x
#         self.next = None
class Solution:
    def hasCycle(self, head) -> bool:
        `,
      java: `/**
 * Definition for singly-linked list.
 * class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; next = null; }
 * }
 */
public class Solution {
    public boolean hasCycle(ListNode head) {

    }
}`,
      javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */
/**
 * @param {ListNode} head
 * @return {boolean}
 */
var hasCycle = function(head) {

};`,
      c: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 */
bool hasCycle(struct ListNode *head) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    int val; ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

__USER_CODE__

int main() {
    vector<int> vals; int x;
    string line; getline(cin, line);
    istringstream ss(line); while (ss >> x) vals.push_back(x);
    int pos; cin >> pos;
    if (vals.empty()) { cout << "false" << endl; return 0; }
    vector<ListNode*> nodes;
    for (int v : vals) nodes.push_back(new ListNode(v));
    for (int i = 0; i < (int)nodes.size()-1; i++) nodes[i]->next = nodes[i+1];
    if (pos != -1) nodes.back()->next = nodes[pos];
    Solution sol;
    cout << (sol.hasCycle(nodes[0]) ? "true" : "false") << endl;
    return 0;
}`,
      python: `import sys

class ListNode:
    def __init__(self, x):
        self.val = x; self.next = None

__USER_CODE__

data = sys.stdin.read().split('\\n')
vals = list(map(int, data[0].split()))
pos = int(data[1].strip())
if not vals: print('false'); exit()
nodes = [ListNode(v) for v in vals]
for i in range(len(nodes)-1): nodes[i].next = nodes[i+1]
if pos != -1: nodes[-1].next = nodes[pos]
print(str(Solution().hasCycle(nodes[0])).lower())`,
      java: `import java.util.*;

class ListNode {
    int val; ListNode next;
    ListNode(int x) { val = x; }
}

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] vals = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        int pos = sc.nextInt();
        if (vals.length == 0) { System.out.println("false"); return; }
        ListNode[] nodes = new ListNode[vals.length];
        for (int i = 0; i < vals.length; i++) nodes[i] = new ListNode(vals[i]);
        for (int i = 0; i < vals.length-1; i++) nodes[i].next = nodes[i+1];
        if (pos != -1) nodes[vals.length-1].next = nodes[pos];
        System.out.println(new Solution().hasCycle(nodes[0]));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const vals = lines[0].split(' ').map(Number);
const pos = parseInt(lines[1]);

function ListNode(val) { this.val = val; this.next = null; }

__USER_CODE__

if (!vals.length) { console.log('false'); process.exit(0); }
const nodes = vals.map(v => new ListNode(v));
for (let i = 0; i < nodes.length-1; i++) nodes[i].next = nodes[i+1];
if (pos !== -1) nodes[nodes.length-1].next = nodes[pos];
console.log(String(hasCycle(nodes[0])));`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

struct ListNode { int val; struct ListNode *next; };

__USER_CODE__

int main() {
    int vals[10001], n = 0, pos;
    char buf[200000]; fgets(buf, sizeof(buf), stdin);
    char *p = buf;
    while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } vals[n++] = strtol(p, &p, 10); }
    scanf("%d", &pos);
    if (n == 0) { printf("false\\n"); return 0; }
    struct ListNode *nodes = malloc(n * sizeof(struct ListNode));
    for (int i = 0; i < n; i++) { nodes[i].val = vals[i]; nodes[i].next = i+1 < n ? &nodes[i+1] : NULL; }
    if (pos != -1) nodes[n-1].next = &nodes[pos];
    printf("%s\\n", hasCycle(&nodes[0]) ? "true" : "false");
    free(nodes); return 0;
}`,
    },
    aiContext: "Linked List Cycle — Floyd's tortoise and hare O(n)",
  },

  // ── 32. Symmetric Tree ───────────────────────────────────────────────────────
  {
    number: 32, title: 'Symmetric Tree', slug: 'symmetric-tree', difficulty: 'Easy',
    tags: ['Tree', 'DFS', 'BFS'], companies: ['LinkedIn', 'Bloomberg', 'Microsoft'],
    acceptance: 53.5, premium: false,
    description: `Given a binary tree in level-order (space-separated, use <code>null</code> for missing nodes), check whether it is a mirror of itself (symmetric around its center).`,
    examples: [
      { input: '1 2 2 3 4 4 3',      output: 'true'  },
      { input: '1 2 2 null 3 null 3', output: 'false' },
    ],
    constraints: ['1 ≤ number of nodes ≤ 1000', '-100 ≤ Node.val ≤ 100'],
    testCases: [
      { input: '1 2 2 3 4 4 3',      expected: 'true',  hidden: false },
      { input: '1 2 2 null 3 null 3', expected: 'false', hidden: false },
      { input: '1',                   expected: 'true',  hidden: true  },
      { input: '1 2 2 3 null 3 null', expected: 'false', hidden: true  },
    ],
    hints: [
      'Two trees are mirrors if their root values match.',
      "Left subtree's left must equal right subtree's right.",
      "Left subtree's right must equal right subtree's left.",
    ],
    starter: {
      cpp: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 * };
 */
class Solution {
public:
    bool isSymmetric(TreeNode* root) {

    }
};`,
      python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSymmetric(self, root: Optional[TreeNode]) -> bool:
        `,
      java: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 * }
 */
class Solution {
    public boolean isSymmetric(TreeNode root) {

    }
}`,
      javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {boolean}
 */
var isSymmetric = function(root) {

};`,
      c: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */
bool isSymmetric(struct TreeNode* root) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* build(vector<string>& v, int i) {
    if (i >= (int)v.size() || v[i] == "null") return nullptr;
    TreeNode* n = new TreeNode(stoi(v[i]));
    n->left = build(v, 2*i+1); n->right = build(v, 2*i+2);
    return n;
}

__USER_CODE__

int main() {
    vector<string> vals; string s;
    while (cin >> s) vals.push_back(s);
    TreeNode* root = vals.empty() || vals[0] == "null" ? nullptr : build(vals, 0);
    Solution sol;
    cout << (sol.isSymmetric(root) ? "true" : "false") << endl;
    return 0;
}`,
      python: `from typing import Optional
from collections import deque
import sys

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def build(vals):
    if not vals or vals[0] == 'null': return None
    root = TreeNode(int(vals[0])); q = deque([root]); i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals) and vals[i] != 'null': node.left = TreeNode(int(vals[i])); q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] != 'null': node.right = TreeNode(int(vals[i])); q.append(node.right)
        i += 1
    return root

__USER_CODE__

vals = sys.stdin.read().split()
print(str(Solution().isSymmetric(build(vals))).lower())`,
      java: `import java.util.*;

class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

__USER_CODE__

public class Main {
    static TreeNode build(String[] v, int i) {
        if (i >= v.length || v[i].equals("null")) return null;
        TreeNode n = new TreeNode(Integer.parseInt(v[i]));
        n.left = build(v, 2*i+1); n.right = build(v, 2*i+2);
        return n;
    }
    public static void main(String[] args) {
        String[] vals = new Scanner(System.in).useDelimiter("\\\\s+").tokens().toArray(String[]::new);
        TreeNode root = vals.length == 0 || vals[0].equals("null") ? null : build(vals, 0);
        System.out.println(new Solution().isSymmetric(root));
    }
}`,
      javascript: `const vals = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/);

function TreeNode(val, left, right) { this.val = val ?? 0; this.left = left ?? null; this.right = right ?? null; }

function build(vals, i = 0) {
    if (i >= vals.length || vals[i] === 'null') return null;
    const n = new TreeNode(+vals[i]);
    n.left = build(vals, 2*i+1); n.right = build(vals, 2*i+2);
    return n;
}

__USER_CODE__

const root = !vals.length || vals[0] === 'null' ? null : build(vals);
console.log(String(isSymmetric(root)));`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

struct TreeNode { int val; struct TreeNode *left, *right; };
struct TreeNode* newNode(int v) { struct TreeNode* n = malloc(sizeof(struct TreeNode)); n->val=v; n->left=n->right=NULL; return n; }

struct TreeNode* build(char toks[][20], int n, int i) {
    if (i >= n || strcmp(toks[i], "null") == 0) return NULL;
    struct TreeNode* node = newNode(atoi(toks[i]));
    node->left = build(toks, n, 2*i+1); node->right = build(toks, n, 2*i+2);
    return node;
}

__USER_CODE__

int main() {
    char toks[10000][20]; int tc = 0;
    while (scanf("%s", toks[tc]) == 1) tc++;
    struct TreeNode* root = (tc == 0 || strcmp(toks[0], "null") == 0) ? NULL : build(toks, tc, 0);
    printf("%s\\n", isSymmetric(root) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Symmetric Tree — recursive mirror check O(n)',
  },

  // ── 33. Balanced Binary Tree ──────────────────────────────────────────────────
  {
    number: 33, title: 'Balanced Binary Tree', slug: 'balanced-binary-tree', difficulty: 'Easy',
    tags: ['Tree', 'DFS'], companies: ['Bloomberg', 'Microsoft', 'Amazon'],
    acceptance: 49.8, premium: false,
    description: `Given a binary tree in level-order (space-separated, use <code>null</code> for missing nodes), determine if it is height-balanced (the depth of the two subtrees of every node differs by at most 1).`,
    examples: [
      { input: '3 9 20 null null 15 7',   output: 'true'  },
      { input: '1 2 2 3 3 null null 4 4', output: 'false' },
    ],
    constraints: ['0 ≤ number of nodes ≤ 5000', '-10⁴ ≤ Node.val ≤ 10⁴'],
    testCases: [
      { input: '3 9 20 null null 15 7',   expected: 'true',  hidden: false },
      { input: '1 2 2 3 3 null null 4 4', expected: 'false', hidden: false },
      { input: 'null',                    expected: 'true',  hidden: true  },
      { input: '1 2 null 3',              expected: 'false', hidden: true  },
    ],
    hints: [
      'DFS returns height, or -1 if the subtree is unbalanced.',
      'At each node check |leftHeight - rightHeight| <= 1.',
      'Propagate -1 upward if any subtree is unbalanced.',
    ],
    starter: {
      cpp: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 * };
 */
class Solution {
public:
    bool isBalanced(TreeNode* root) {

    }
};`,
      python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isBalanced(self, root: Optional[TreeNode]) -> bool:
        `,
      java: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 * }
 */
class Solution {
    public boolean isBalanced(TreeNode root) {

    }
}`,
      javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {boolean}
 */
var isBalanced = function(root) {

};`,
      c: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */
bool isBalanced(struct TreeNode* root) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* build(vector<string>& v, int i) {
    if (i >= (int)v.size() || v[i] == "null") return nullptr;
    TreeNode* n = new TreeNode(stoi(v[i]));
    n->left = build(v, 2*i+1); n->right = build(v, 2*i+2);
    return n;
}

__USER_CODE__

int main() {
    vector<string> vals; string s;
    while (cin >> s) vals.push_back(s);
    TreeNode* root = vals.empty() || vals[0] == "null" ? nullptr : build(vals, 0);
    Solution sol;
    cout << (sol.isBalanced(root) ? "true" : "false") << endl;
    return 0;
}`,
      python: `from typing import Optional
from collections import deque
import sys

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def build(vals):
    if not vals or vals[0] == 'null': return None
    root = TreeNode(int(vals[0])); q = deque([root]); i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals) and vals[i] != 'null': node.left = TreeNode(int(vals[i])); q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] != 'null': node.right = TreeNode(int(vals[i])); q.append(node.right)
        i += 1
    return root

__USER_CODE__

vals = sys.stdin.read().split()
print(str(Solution().isBalanced(build(vals))).lower())`,
      java: `import java.util.*;

class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

__USER_CODE__

public class Main {
    static TreeNode build(String[] v, int i) {
        if (i >= v.length || v[i].equals("null")) return null;
        TreeNode n = new TreeNode(Integer.parseInt(v[i]));
        n.left = build(v, 2*i+1); n.right = build(v, 2*i+2);
        return n;
    }
    public static void main(String[] args) {
        String[] vals = new Scanner(System.in).useDelimiter("\\\\s+").tokens().toArray(String[]::new);
        TreeNode root = vals.length == 0 || vals[0].equals("null") ? null : build(vals, 0);
        System.out.println(new Solution().isBalanced(root));
    }
}`,
      javascript: `const vals = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/);

function TreeNode(val, left, right) { this.val = val ?? 0; this.left = left ?? null; this.right = right ?? null; }

function build(vals, i = 0) {
    if (i >= vals.length || vals[i] === 'null') return null;
    const n = new TreeNode(+vals[i]);
    n.left = build(vals, 2*i+1); n.right = build(vals, 2*i+2);
    return n;
}

__USER_CODE__

const root = !vals.length || vals[0] === 'null' ? null : build(vals);
console.log(String(isBalanced(root)));`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

struct TreeNode { int val; struct TreeNode *left, *right; };
struct TreeNode* newNode(int v) { struct TreeNode* n = malloc(sizeof(struct TreeNode)); n->val=v; n->left=n->right=NULL; return n; }

struct TreeNode* build(char toks[][20], int n, int i) {
    if (i >= n || strcmp(toks[i], "null") == 0) return NULL;
    struct TreeNode* node = newNode(atoi(toks[i]));
    node->left = build(toks, n, 2*i+1); node->right = build(toks, n, 2*i+2);
    return node;
}

__USER_CODE__

int main() {
    char toks[10000][20]; int tc = 0;
    while (scanf("%s", toks[tc]) == 1) tc++;
    struct TreeNode* root = (tc == 0 || strcmp(toks[0], "null") == 0) ? NULL : build(toks, tc, 0);
    printf("%s\\n", isBalanced(root) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Balanced Binary Tree — DFS returning -1 on imbalance O(n)',
  },

  // ── 34. Merge Two Sorted Lists ───────────────────────────────────────────────
  {
    number: 34, title: 'Merge Two Sorted Lists', slug: 'merge-two-sorted-lists', difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'], companies: ['Amazon', 'Microsoft', 'Apple'],
    acceptance: 62.3, premium: false,
    description: `Merge two sorted linked lists and return it as a sorted list.<br><br>Input: two lines, each with space-separated integers (empty line = empty list). Output: merged list space-separated.`,
    examples: [
      { input: '1 2 4\n1 3 4', output: '1 1 2 3 4 4' },
      { input: '\n',           output: ''             },
      { input: '\n0',          output: '0'            },
    ],
    constraints: ['0 ≤ n, m ≤ 50', '-100 ≤ Node.val ≤ 100', 'Both lists are sorted in non-decreasing order'],
    testCases: [
      { input: '1 2 4\n1 3 4', expected: '1 1 2 3 4 4', hidden: false },
      { input: '\n',           expected: '',             hidden: false },
      { input: '\n0',          expected: '0',            hidden: true  },
      { input: '1 3 5\n2 4 6', expected: '1 2 3 4 5 6', hidden: true  },
    ],
    hints: [
      'Use a dummy head node to simplify edge cases.',
      'Compare heads of both lists, append the smaller one.',
      'Append the remaining list at the end.',
    ],
    starter: {
      cpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 * };
 */
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {

    }
};`,
      python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        `,
      java: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 * }
 */
class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {

    }
}`,
      javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
var mergeTwoLists = function(list1, list2) {

};`,
      c: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     struct ListNode *next;
 * };
 */
struct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    int val; ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

ListNode* makeList(string line) {
    if (line.empty()) return nullptr;
    istringstream ss(line); vector<int> v; int x;
    while (ss >> x) v.push_back(x);
    if (v.empty()) return nullptr;
    ListNode* h = new ListNode(v[0]); ListNode* c = h;
    for (int i = 1; i < (int)v.size(); i++) { c->next = new ListNode(v[i]); c = c->next; }
    return h;
}

__USER_CODE__

int main() {
    string l1, l2; getline(cin, l1); getline(cin, l2);
    ListNode* res = Solution().mergeTwoLists(makeList(l1), makeList(l2));
    bool first = true;
    while (res) { if (!first) cout << " "; cout << res->val; res = res->next; first = false; }
    cout << endl; return 0;
}`,
      python: `from typing import Optional
import sys

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val; self.next = next

def makeList(line):
    vals = list(map(int, line.split())) if line.strip() else []
    if not vals: return None
    h = ListNode(vals[0]); c = h
    for v in vals[1:]: c.next = ListNode(v); c = c.next
    return h

__USER_CODE__

lines = sys.stdin.read().split('\\n')
l1 = makeList(lines[0] if lines else '')
l2 = makeList(lines[1] if len(lines) > 1 else '')
res = Solution().mergeTwoLists(l1, l2)
out = []
while res: out.append(str(res.val)); res = res.next
print(' '.join(out))`,
      java: `import java.util.*;

class ListNode {
    int val; ListNode next;
    ListNode(int v) { val = v; }
}

__USER_CODE__

public class Main {
    static ListNode makeList(String line) {
        if (line == null || line.trim().isEmpty()) return null;
        String[] parts = line.trim().split(" ");
        ListNode h = new ListNode(Integer.parseInt(parts[0])), c = h;
        for (int i = 1; i < parts.length; i++) { c.next = new ListNode(Integer.parseInt(parts[i])); c = c.next; }
        return h;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String l1 = sc.hasNextLine() ? sc.nextLine() : "";
        String l2 = sc.hasNextLine() ? sc.nextLine() : "";
        ListNode res = new Solution().mergeTwoLists(makeList(l1), makeList(l2));
        StringBuilder sb = new StringBuilder();
        while (res != null) { if (sb.length() > 0) sb.append(" "); sb.append(res.val); res = res.next; }
        System.out.println(sb);
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');

function ListNode(val, next) { this.val = val ?? 0; this.next = next ?? null; }

function makeList(line) {
    const vals = line && line.trim() ? line.trim().split(' ').map(Number) : [];
    if (!vals.length) return null;
    const h = new ListNode(vals[0]); let c = h;
    for (let i = 1; i < vals.length; i++) { c.next = new ListNode(vals[i]); c = c.next; }
    return h;
}

__USER_CODE__

let res = mergeTwoLists(makeList(lines[0] || ''), makeList(lines[1] || ''));
const out = [];
while (res) { out.push(res.val); res = res.next; }
console.log(out.join(' '));`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct ListNode { int val; struct ListNode *next; };
struct ListNode* newNode(int v) { struct ListNode* n = malloc(sizeof(struct ListNode)); n->val=v; n->next=NULL; return n; }

struct ListNode* makeList(char* buf) {
    if (!buf || buf[0] == '\\n' || buf[0] == '\\0') return NULL;
    struct ListNode *h = NULL, **tail = &h; char *p = buf;
    while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } *tail = newNode(strtol(p,&p,10)); tail = &(*tail)->next; }
    return h;
}

__USER_CODE__

int main() {
    char b1[500], b2[500];
    fgets(b1, sizeof(b1), stdin); fgets(b2, sizeof(b2), stdin);
    struct ListNode* res = mergeTwoLists(makeList(b1), makeList(b2));
    int first = 1;
    while (res) { if (!first) printf(" "); printf("%d", res->val); res = res->next; first = 0; }
    printf("\\n"); return 0;
}`,
    },
    aiContext: 'Merge Two Sorted Lists — iterative dummy head O(m+n)',
  },

  // ── 35. Spiral Matrix ────────────────────────────────────────────────────────
  {
    number: 35, title: 'Spiral Matrix', slug: 'spiral-matrix', difficulty: 'Medium',
    tags: ['Array', 'Matrix', 'Simulation'], companies: ['Microsoft', 'Amazon', 'Google'],
    acceptance: 46.0, premium: false,
    description: `Given an <code>m x n</code> matrix, return all elements in spiral order (space-separated on one line).<br><br>Input: m rows of n space-separated integers.`,
    examples: [
      { input: '1 2 3\n4 5 6\n7 8 9',          output: '1 2 3 6 9 8 7 4 5'          },
      { input: '1 2 3 4\n5 6 7 8\n9 10 11 12', output: '1 2 3 4 8 12 11 10 9 5 6 7' },
    ],
    constraints: ['1 ≤ m, n ≤ 10', '-100 ≤ matrix[i][j] ≤ 100'],
    testCases: [
      { input: '1 2 3\n4 5 6\n7 8 9',          expected: '1 2 3 6 9 8 7 4 5',          hidden: false },
      { input: '1 2 3 4\n5 6 7 8\n9 10 11 12', expected: '1 2 3 4 8 12 11 10 9 5 6 7', hidden: false },
      { input: '1',                             expected: '1',                           hidden: true  },
      { input: '1 2\n3 4',                      expected: '1 2 4 3',                    hidden: true  },
    ],
    hints: [
      'Maintain four boundaries: top, bottom, left, right.',
      'Traverse in order: left→right, top→bottom, right→left, bottom→top.',
      'Shrink boundaries after each direction pass.',
    ],
    starter: {
      cpp: `class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {

    }
};`,
      python: `class Solution:
    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:
        `,
      java: `class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {

    }
}`,
      javascript: `/**
 * @param {number[][]} matrix
 * @return {number[]}
 */
var spiralOrder = function(matrix) {

};`,
      c: `int* spiralOrder(int** matrix, int matrixSize, int* matrixColSize, int* returnSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<vector<int>> matrix; string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        istringstream ss(line); vector<int> row; int x;
        while (ss >> x) row.push_back(x);
        matrix.push_back(row);
    }
    Solution sol;
    vector<int> res = sol.spiralOrder(matrix);
    for (int i = 0; i < (int)res.size(); i++) cout << (i ? " " : "") << res[i];
    cout << endl; return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
matrix = [list(map(int, l.split())) for l in lines]
print(*Solution().spiralOrder(matrix))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<int[]> rows = new ArrayList<>();
        while (sc.hasNextLine()) { String l = sc.nextLine().trim(); if (l.isEmpty()) continue; rows.add(Arrays.stream(l.split(" ")).mapToInt(Integer::parseInt).toArray()); }
        int[][] m = rows.toArray(new int[0][]);
        List<Integer> res = new Solution().spiralOrder(m);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < res.size(); i++) sb.append(i > 0 ? " " : "").append(res.get(i));
        System.out.println(sb);
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const matrix = lines.map(l => l.split(' ').map(Number));

__USER_CODE__

console.log(spiralOrder(matrix).join(' '));`,
      c: `#include <stdio.h>
#include <stdlib.h>

__USER_CODE__

int main() {
    int m[11][11], rows = 0, cols = 0; char buf[500];
    while (fgets(buf, sizeof(buf), stdin)) {
        if (buf[0] == '\\n') continue; char *p = buf; int j = 0;
        while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } m[rows][j++] = strtol(p, &p, 10); }
        cols = j; rows++;
    }
    int *ptrs[11]; int colSizes[11];
    for (int i = 0; i < rows; i++) { ptrs[i] = m[i]; colSizes[i] = cols; }
    int retSize;
    int *res = spiralOrder((int**)ptrs, rows, colSizes, &retSize);
    for (int i = 0; i < retSize; i++) printf("%s%d", i ? " " : "", res[i]);
    printf("\\n"); free(res); return 0;
}`,
    },
    aiContext: 'Spiral Matrix — boundary simulation O(m*n)',
  },

  // ── 36. Find Minimum in Rotated Sorted Array ─────────────────────────────────
  {
    number: 36, title: 'Find Minimum in Rotated Sorted Array', slug: 'find-minimum-in-rotated-sorted-array', difficulty: 'Medium',
    tags: ['Array', 'Binary Search'], companies: ['Microsoft', 'Amazon', 'Facebook'],
    acceptance: 48.4, premium: false,
    description: `Given a sorted array that has been rotated between 1 and n times, find the minimum element. You must write an algorithm that runs in <code>O(log n)</code>.`,
    examples: [
      { input: 'nums = [3,4,5,1,2]',     output: '1'  },
      { input: 'nums = [4,5,6,7,0,1,2]', output: '0'  },
      { input: 'nums = [11,13,15,17]',   output: '11' },
    ],
    constraints: ['1 ≤ n ≤ 5000', 'All values are unique', '-5000 ≤ nums[i] ≤ 5000'],
    testCases: [
      { input: '3 4 5 1 2',     expected: '1',  hidden: false },
      { input: '4 5 6 7 0 1 2', expected: '0',  hidden: false },
      { input: '11 13 15 17',   expected: '11', hidden: false },
      { input: '2 1',           expected: '1',  hidden: true  },
      { input: '1',             expected: '1',  hidden: true  },
    ],
    hints: [
      'Binary search: compare mid with the right boundary.',
      'If nums[mid] > nums[right], minimum is in the right half.',
      'Otherwise minimum is in the left half (including mid).',
    ],
    starter: {
      cpp: `class Solution {
public:
    int findMin(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def findMin(self, nums: List[int]) -> int:
        `,
      java: `class Solution {
    public int findMin(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var findMin = function(nums) {

};`,
      c: `int findMin(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    cout << sol.findMin(nums) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(Solution().findMin(nums))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().findMin(nums));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(findMin(nums));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[5001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    printf("%d\\n", findMin(nums, n));
    return 0;
}`,
    },
    aiContext: 'Find Minimum in Rotated Sorted Array — binary search O(log n)',
  },

  // ── 37. Subsets ──────────────────────────────────────────────────────────────
  {
    number: 37, title: 'Subsets', slug: 'subsets', difficulty: 'Medium',
    tags: ['Array', 'Backtracking', 'Bit Manipulation'], companies: ['Facebook', 'Amazon', 'Bloomberg'],
    acceptance: 74.3, premium: false,
    description: `Given an integer array <code>nums</code> of unique elements, return all possible subsets (the power set).<br><br>Print each subset on a separate line as space-separated integers. Print empty line for empty subset. Output in lexicographic order.`,
    examples: [
      { input: 'nums = [1,2,3]', output: '\n1\n1 2\n1 2 3\n1 3\n2\n2 3\n3' },
      { input: 'nums = [0]',     output: '\n0'                               },
    ],
    constraints: ['1 ≤ nums.length ≤ 10', 'All elements are unique', '-10 ≤ nums[i] ≤ 10'],
    testCases: [
      { input: '1 2 3', expected: '\n1\n1 2\n1 2 3\n1 3\n2\n2 3\n3', hidden: false },
      { input: '0',     expected: '\n0',                              hidden: false },
      { input: '1 2',   expected: '\n1\n1 2\n2',                     hidden: true  },
    ],
    hints: [
      'Use backtracking: at each index choose to include or exclude the element.',
      'Or use bitmask: for n elements there are 2^n subsets.',
      'Sort nums first to ensure lexicographic order.',
    ],
    starter: {
      cpp: `class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def subsets(self, nums: List[int]) -> List[List[int]]:
        `,
      java: `class Solution {
    public List<List<Integer>> subsets(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var subsets = function(nums) {

};`,
      c: `int** subsets(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    sort(nums.begin(), nums.end());
    Solution sol;
    vector<vector<int>> res = sol.subsets(nums);
    sort(res.begin(), res.end());
    for (auto& s : res) {
        for (int i = 0; i < (int)s.size(); i++) cout << (i ? " " : "") << s[i];
        cout << "\\n";
    }
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = sorted(map(int, sys.stdin.read().split()))
res = Solution().subsets(nums)
res.sort()
for s in res: print(*s)`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        Arrays.sort(nums);
        List<List<Integer>> res = new Solution().subsets(nums);
        res.sort(Comparator.comparing(Object::toString));
        for (List<Integer> s : res) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < s.size(); i++) sb.append(i > 0 ? " " : "").append(s.get(i));
            System.out.println(sb);
        }
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number).sort((a,b)=>a-b);

__USER_CODE__

const res = subsets(nums);
res.sort((a,b) => { for(let i=0;i<Math.min(a.length,b.length);i++) if(a[i]!==b[i]) return a[i]-b[i]; return a.length-b.length; });
for (const s of res) console.log(s.join(' '));`,
      c: `#include <stdio.h>
#include <stdlib.h>

__USER_CODE__

int main() {
    int nums[20], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    int retSize; int *retColSizes;
    int **res = subsets(nums, n, &retSize, &retColSizes);
    for (int i = 0; i < retSize; i++) {
        for (int j = 0; j < retColSizes[i]; j++) printf("%s%d", j ? " " : "", res[i][j]);
        printf("\\n");
    }
    return 0;
}`,
    },
    aiContext: 'Subsets — backtracking or bitmask O(2^n)',
  },

  // ── 38. Permutations ─────────────────────────────────────────────────────────
  {
    number: 38, title: 'Permutations', slug: 'permutations', difficulty: 'Medium',
    tags: ['Array', 'Backtracking'], companies: ['LinkedIn', 'Microsoft', 'Amazon'],
    acceptance: 74.4, premium: false,
    description: `Given an array of distinct integers, return all possible permutations.<br><br>Print each permutation on a separate line as space-separated integers. Print in lexicographic order.`,
    examples: [
      { input: 'nums = [1,2,3]', output: '1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1' },
      { input: 'nums = [0,1]',   output: '0 1\n1 0'                                   },
      { input: 'nums = [1]',     output: '1'                                           },
    ],
    constraints: ['1 ≤ nums.length ≤ 6', 'All integers are unique', '-10 ≤ nums[i] ≤ 10'],
    testCases: [
      { input: '1 2 3', expected: '1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1', hidden: false },
      { input: '0 1',   expected: '0 1\n1 0',                                   hidden: false },
      { input: '1',     expected: '1',                                           hidden: true  },
    ],
    hints: [
      'Use backtracking with a used[] boolean array.',
      'At each position try all unused elements.',
      'Sort nums first for lexicographic output.',
    ],
    starter: {
      cpp: `class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        `,
      java: `class Solution {
    public List<List<Integer>> permute(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var permute = function(nums) {

};`,
      c: `int** permute(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    sort(nums.begin(), nums.end());
    Solution sol;
    vector<vector<int>> res = sol.permute(nums);
    sort(res.begin(), res.end());
    for (auto& p : res) {
        for (int i = 0; i < (int)p.size(); i++) cout << (i ? " " : "") << p[i];
        cout << "\\n";
    }
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = sorted(map(int, sys.stdin.read().split()))
res = Solution().permute(nums)
res.sort()
for p in res: print(*p)`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        Arrays.sort(nums);
        List<List<Integer>> res = new Solution().permute(nums);
        res.sort(Comparator.comparing(Object::toString));
        for (List<Integer> p : res) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < p.size(); i++) sb.append(i > 0 ? " " : "").append(p.get(i));
            System.out.println(sb);
        }
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number).sort((a,b)=>a-b);

__USER_CODE__

const res = permute(nums);
res.sort((a,b) => { for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return a[i]-b[i]; return 0; });
for (const p of res) console.log(p.join(' '));`,
      c: `#include <stdio.h>
#include <stdlib.h>

__USER_CODE__

int main() {
    int nums[7], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    int retSize; int *retColSizes;
    int **res = permute(nums, n, &retSize, &retColSizes);
    for (int i = 0; i < retSize; i++) {
        for (int j = 0; j < retColSizes[i]; j++) printf("%s%d", j ? " " : "", res[i][j]);
        printf("\\n");
    }
    return 0;
}`,
    },
    aiContext: 'Permutations — backtracking O(n!)',
  },

  // ── 39. Combination Sum ──────────────────────────────────────────────────────
  {
    number: 39, title: 'Combination Sum', slug: 'combination-sum', difficulty: 'Medium',
    tags: ['Array', 'Backtracking'], companies: ['Amazon', 'Google', 'Facebook'],
    acceptance: 67.2, premium: false,
    description: `Given an array of distinct integers <code>candidates</code> and a target integer, return all unique combinations where the chosen numbers sum to target. The same number may be used unlimited times.<br><br>First line: space-separated candidates. Second line: target. Print each combination sorted, one per line.`,
    examples: [
      { input: '2 3 6 7\n7', output: '2 2 3\n7'            },
      { input: '2 3 5\n8',   output: '2 2 2 2\n2 3 3\n3 5' },
    ],
    constraints: ['1 ≤ candidates.length ≤ 30', '2 ≤ candidates[i] ≤ 40', '1 ≤ target ≤ 40'],
    testCases: [
      { input: '2 3 6 7\n7', expected: '2 2 3\n7',            hidden: false },
      { input: '2 3 5\n8',   expected: '2 2 2 2\n2 3 3\n3 5', hidden: false },
      { input: '2\n1',       expected: '',                    hidden: true  },
      { input: '1\n2',       expected: '1 1',                 hidden: true  },
    ],
    hints: [
      'Sort candidates first.',
      'Backtrack: at each step try each candidate starting from current index (allow reuse).',
      'Prune when remaining target < candidate.',
    ],
    starter: {
      cpp: `class Solution {
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {

    }
};`,
      python: `class Solution:
    def combinationSum(self, candidates: List[int], target: int) -> List[List[int]]:
        `,
      java: `class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {

    }
}`,
      javascript: `/**
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 */
var combinationSum = function(candidates, target) {

};`,
      c: `int** combinationSum(int* candidates, int candidatesSize, int target, int* returnSize, int** returnColumnSizes) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string line; getline(cin, line);
    istringstream ss(line); vector<int> cands; int x;
    while (ss >> x) cands.push_back(x);
    int target; cin >> target;
    Solution sol;
    vector<vector<int>> res = sol.combinationSum(cands, target);
    sort(res.begin(), res.end());
    for (auto& v : res) {
        for (int i = 0; i < (int)v.size(); i++) cout << (i ? " " : "") << v[i];
        cout << "\\n";
    }
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

data = sys.stdin.read().split('\\n')
cands = list(map(int, data[0].split()))
target = int(data[1].strip())
res = Solution().combinationSum(cands, target)
res.sort()
for v in res: print(*v)`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] cands = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        int target = sc.nextInt();
        List<List<Integer>> res = new Solution().combinationSum(cands, target);
        res.sort(Comparator.comparing(Object::toString));
        for (List<Integer> v : res) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < v.size(); i++) sb.append(i > 0 ? " " : "").append(v.get(i));
            System.out.println(sb);
        }
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const cands = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);

__USER_CODE__

const res = combinationSum(cands, target);
res.sort((a,b) => { for(let i=0;i<Math.min(a.length,b.length);i++) if(a[i]!==b[i]) return a[i]-b[i]; return a.length-b.length; });
for (const v of res) console.log(v.join(' '));`,
      c: `#include <stdio.h>
#include <stdlib.h>

__USER_CODE__

int main() {
    int cands[31], nc = 0, target;
    char buf[500]; fgets(buf, sizeof(buf), stdin); char *p = buf;
    while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } cands[nc++] = strtol(p, &p, 10); }
    scanf("%d", &target);
    int retSize; int *retColSizes;
    int **res = combinationSum(cands, nc, target, &retSize, &retColSizes);
    for (int i = 0; i < retSize; i++) {
        for (int j = 0; j < retColSizes[i]; j++) printf("%s%d", j ? " " : "", res[i][j]);
        printf("\\n");
    }
    return 0;
}`,
    },
    aiContext: 'Combination Sum — backtracking with reuse O(2^(t/min))',
  },

  // ── 40. Count Primes ─────────────────────────────────────────────────────────
  {
    number: 40, title: 'Count Primes', slug: 'count-primes', difficulty: 'Medium',
    tags: ['Array', 'Math', 'Enumeration', 'Number Theory'],
    companies: ['Amazon', 'Microsoft', 'Bloomberg'], acceptance: 33.0, premium: false,
    description: `Given an integer <code>n</code>, return the number of prime numbers that are strictly less than <code>n</code>.`,
    examples: [
      { input: 'n = 10', output: '4', explanation: '2, 3, 5, 7 are prime' },
      { input: 'n = 0',  output: '0' },
      { input: 'n = 1',  output: '0' },
    ],
    constraints: ['0 ≤ n ≤ 5×10⁶'],
    testCases: [
      { input: '10',   expected: '4',   hidden: false },
      { input: '0',    expected: '0',   hidden: false },
      { input: '1',    expected: '0',   hidden: false },
      { input: '100',  expected: '25',  hidden: true  },
      { input: '5000', expected: '669', hidden: true  },
    ],
    hints: [
      'Use the Sieve of Eratosthenes.',
      'Mark all multiples of each prime as composite.',
      'Count remaining unmarked numbers (2 to n-1).',
    ],
    starter: {
      cpp: `class Solution {
public:
    int countPrimes(int n) {

    }
};`,
      python: `class Solution:
    def countPrimes(self, n: int) -> int:
        `,
      java: `class Solution {
    public int countPrimes(int n) {

    }
}`,
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
var countPrimes = function(n) {

};`,
      c: `int countPrimes(int n) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int n; cin >> n;
    Solution sol;
    cout << sol.countPrimes(n) << endl;
    return 0;
}`,
      python: `import sys

__USER_CODE__

n = int(sys.stdin.read().strip())
print(Solution().countPrimes(n))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        System.out.println(new Solution().countPrimes(n));
    }
}`,
      javascript: `const n = parseInt(require('fs').readFileSync('/dev/stdin','utf8').trim());

__USER_CODE__

console.log(countPrimes(n));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int n; scanf("%d", &n);
    printf("%d\\n", countPrimes(n));
    return 0;
}`,
    },
    aiContext: 'Count Primes — Sieve of Eratosthenes O(n log log n)',
  },


  // ── PROBLEMS 41–50 ────────────────────────────────────────────────────────────
// Each problem has:
//   starter     → what the user sees in the editor (function signature only)
//   codeWrapper → full runnable code sent to Judge0 (__USER_CODE__ = user's class)

  // ── 41. Longest Palindromic Substring ────────────────────────────────────────
  {
    number: 41, title: 'Longest Palindromic Substring', slug: 'longest-palindromic-substring', difficulty: 'Medium',
    tags: ['String', 'Dynamic Programming'], companies: ['Amazon', 'Microsoft', 'Apple'],
    acceptance: 32.4, premium: false,
    description: `Given a string <code>s</code>, return the longest palindromic substring.`,
    examples: [
      { input: 's = "babad"', output: 'bab', explanation: '"aba" is also valid' },
      { input: 's = "cbbd"',  output: 'bb'  },
    ],
    constraints: ['1 ≤ s.length ≤ 1000', 's consists of digits and English letters'],
    testCases: [
      { input: 'babad',   expected: 'bab',     hidden: false },
      { input: 'cbbd',    expected: 'bb',      hidden: false },
      { input: 'a',       expected: 'a',       hidden: true  },
      { input: 'ac',      expected: 'a',       hidden: true  },
      { input: 'racecar', expected: 'racecar', hidden: true  },
    ],
    hints: [
      'Expand around center for each character.',
      'Try both odd-length and even-length palindromes.',
      'Track the start index and maximum length.',
    ],
    starter: {
      cpp: `class Solution {
public:
    string longestPalindrome(string s) {

    }
};`,
      python: `class Solution:
    def longestPalindrome(self, s: str) -> str:
        `,
      java: `class Solution {
    public String longestPalindrome(String s) {

    }
}`,
      javascript: `/**
 * @param {string} s
 * @return {string}
 */
var longestPalindrome = function(s) {

};`,
      c: `char* longestPalindrome(char* s) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string s; getline(cin, s);
    Solution sol;
    cout << sol.longestPalindrome(s) << endl;
    return 0;
}`,
      python: `import sys

__USER_CODE__

s = sys.stdin.read().strip()
print(Solution().longestPalindrome(s))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        String s = new Scanner(System.in).nextLine().trim();
        System.out.println(new Solution().longestPalindrome(s));
    }
}`,
      javascript: `const s = require('fs').readFileSync('/dev/stdin','utf8').trim();

__USER_CODE__

console.log(longestPalindrome(s));`,
      c: `#include <stdio.h>
#include <string.h>

__USER_CODE__

int main() {
    char s[1001]; fgets(s, sizeof(s), stdin);
    int n = strlen(s); if (s[n-1] == '\\n') s[--n] = '\\0';
    printf("%s\\n", longestPalindrome(s));
    return 0;
}`,
    },
    aiContext: 'Longest Palindromic Substring — expand around center O(n²)',
  },

  // ── 42. Decode Ways ──────────────────────────────────────────────────────────
  {
    number: 42, title: 'Decode Ways', slug: 'decode-ways', difficulty: 'Medium',
    tags: ['String', 'Dynamic Programming'], companies: ['Facebook', 'Amazon', 'Uber'],
    acceptance: 32.8, premium: false,
    description: `A message containing letters A-Z can be encoded into numbers (A=1, B=2, ..., Z=26). Given a string of digits <code>s</code>, return the number of ways to decode it.`,
    examples: [
      { input: '12',  output: '2',  explanation: '"AB" (1,2) or "L" (12)' },
      { input: '226', output: '3',  explanation: '"BZ" "VF" or "BBF"'      },
      { input: '06',  output: '0',  explanation: 'Leading zero is invalid'  },
    ],
    constraints: ['1 ≤ s.length ≤ 100', 's contains only digits', 's may contain leading zeros'],
    testCases: [
      { input: '12',    expected: '2', hidden: false },
      { input: '226',   expected: '3', hidden: false },
      { input: '06',    expected: '0', hidden: false },
      { input: '11106', expected: '2', hidden: true  },
      { input: '1',     expected: '1', hidden: true  },
    ],
    hints: [
      'dp[i] = number of ways to decode s[:i].',
      'Single digit valid if s[i-1] != "0".',
      'Two digits valid if s[i-2:i] is between "10" and "26".',
    ],
    starter: {
      cpp: `class Solution {
public:
    int numDecodings(string s) {

    }
};`,
      python: `class Solution:
    def numDecodings(self, s: str) -> int:
        `,
      java: `class Solution {
    public int numDecodings(String s) {

    }
}`,
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
var numDecodings = function(s) {

};`,
      c: `int numDecodings(char* s) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string s; cin >> s;
    Solution sol;
    cout << sol.numDecodings(s) << endl;
    return 0;
}`,
      python: `import sys

__USER_CODE__

s = sys.stdin.read().strip()
print(Solution().numDecodings(s))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        String s = new Scanner(System.in).next().trim();
        System.out.println(new Solution().numDecodings(s));
    }
}`,
      javascript: `const s = require('fs').readFileSync('/dev/stdin','utf8').trim();

__USER_CODE__

console.log(numDecodings(s));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    char s[101]; scanf("%s", s);
    printf("%d\\n", numDecodings(s));
    return 0;
}`,
    },
    aiContext: 'Decode Ways — DP O(n)',
  },

  // ── 43. Word Search ──────────────────────────────────────────────────────────
  {
    number: 43, title: 'Word Search', slug: 'word-search', difficulty: 'Medium',
    tags: ['Array', 'Backtracking', 'Matrix'], companies: ['Amazon', 'Microsoft', 'Facebook'],
    acceptance: 39.7, premium: false,
    description: `Given an <code>m x n</code> grid of characters and a word, return <code>true</code> if the word exists in the grid.<br><br>The word can be constructed from sequentially adjacent cells (horizontal/vertical). The same cell may not be used more than once.<br><br>Input: first line is the word, then each row of the grid.`,
    examples: [
      { input: 'ABCCED\nABCE\nSFCS\nADEE', output: 'true'  },
      { input: 'SEE\nABCE\nSFCS\nADEE',   output: 'true'  },
      { input: 'ABCB\nABCE\nSFCS\nADEE',  output: 'false' },
    ],
    constraints: ['1 ≤ m, n ≤ 6', '1 ≤ word.length ≤ 15', 'grid and word consist of uppercase English letters'],
    testCases: [
      { input: 'ABCCED\nABCE\nSFCS\nADEE', expected: 'true',  hidden: false },
      { input: 'SEE\nABCE\nSFCS\nADEE',    expected: 'true',  hidden: false },
      { input: 'ABCB\nABCE\nSFCS\nADEE',   expected: 'false', hidden: false },
      { input: 'A\nA',                      expected: 'true',  hidden: true  },
    ],
    hints: [
      'Use DFS + backtracking from every cell.',
      'Mark a cell as visited before recursing, restore it after.',
      'Prune early if the current character does not match.',
    ],
    starter: {
      cpp: `class Solution {
public:
    bool exist(vector<vector<char>>& board, string word) {

    }
};`,
      python: `class Solution:
    def exist(self, board: List[List[str]], word: str) -> bool:
        `,
      java: `class Solution {
    public boolean exist(char[][] board, String word) {

    }
}`,
      javascript: `/**
 * @param {character[][]} board
 * @param {string} word
 * @return {boolean}
 */
var exist = function(board, word) {

};`,
      c: `bool exist(char** board, int boardSize, int* boardColSize, char* word) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string word; getline(cin, word);
    vector<vector<char>> board; string line;
    while (getline(cin, line)) { if (!line.empty()) board.push_back(vector<char>(line.begin(), line.end())); }
    Solution sol;
    cout << (sol.exist(board, word) ? "true" : "false") << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
word = lines[0]
board = [list(l) for l in lines[1:]]
print(str(Solution().exist(board, word)).lower())`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String word = sc.nextLine().trim();
        List<char[]> rows = new ArrayList<>();
        while (sc.hasNextLine()) { String l = sc.nextLine(); if (!l.isEmpty()) rows.add(l.toCharArray()); }
        char[][] board = rows.toArray(new char[0][]);
        System.out.println(new Solution().exist(board, word));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const word = lines[0];
const board = lines.slice(1).map(l => l.split(''));

__USER_CODE__

console.log(String(exist(board, word)));`,
      c: `#include <stdio.h>
#include <string.h>
#include <stdbool.h>

__USER_CODE__

int main() {
    char word[20]; scanf("%s", word);
    char bufs[10][10]; int n = 0;
    while (scanf("%s", bufs[n]) == 1) n++;
    char *ptrs[10]; int colSizes[10];
    for (int i = 0; i < n; i++) { ptrs[i] = bufs[i]; colSizes[i] = strlen(bufs[i]); }
    printf("%s\\n", exist(ptrs, n, colSizes, word) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Word Search — DFS backtracking O(m*n*4^L)',
  },

  // ── 44. Gas Station ──────────────────────────────────────────────────────────
  {
    number: 44, title: 'Gas Station', slug: 'gas-station', difficulty: 'Medium',
    tags: ['Array', 'Greedy'], companies: ['Amazon', 'Google', 'Bloomberg'],
    acceptance: 45.1, premium: false,
    description: `There are <code>n</code> gas stations in a circle. Given <code>gas[i]</code> and <code>cost[i]</code>, find the starting station index to complete the circuit. Return -1 if impossible.<br><br>First line: gas values. Second line: cost values.`,
    examples: [
      { input: '1 2 3 4 5\n3 4 5 1 2', output: '3'  },
      { input: '2 3 4\n3 4 3',         output: '-1' },
    ],
    constraints: ['1 ≤ n ≤ 10⁵', '0 ≤ gas[i], cost[i] ≤ 10⁴'],
    testCases: [
      { input: '1 2 3 4 5\n3 4 5 1 2', expected: '3',  hidden: false },
      { input: '2 3 4\n3 4 3',         expected: '-1', hidden: false },
      { input: '5\n4',                 expected: '0',  hidden: true  },
      { input: '1 2\n2 1',             expected: '1',  hidden: true  },
    ],
    hints: [
      'If total gas < total cost, return -1.',
      'Greedily find start: reset when running tank goes negative.',
      'There is at most one valid starting point.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {

    }
};`,
      python: `class Solution:
    def canCompleteCircuit(self, gas: List[int], cost: List[int]) -> int:
        `,
      java: `class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {

    }
}`,
      javascript: `/**
 * @param {number[]} gas
 * @param {number[]} cost
 * @return {number}
 */
var canCompleteCircuit = function(gas, cost) {

};`,
      c: `int canCompleteCircuit(int* gas, int gasSize, int* cost, int costSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string l1, l2; getline(cin, l1); getline(cin, l2);
    istringstream s1(l1), s2(l2);
    vector<int> gas, cost; int x;
    while (s1 >> x) gas.push_back(x);
    while (s2 >> x) cost.push_back(x);
    Solution sol;
    cout << sol.canCompleteCircuit(gas, cost) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
gas  = list(map(int, lines[0].split()))
cost = list(map(int, lines[1].split()))
print(Solution().canCompleteCircuit(gas, cost))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] gas  = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        int[] cost = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        System.out.println(new Solution().canCompleteCircuit(gas, cost));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const gas  = lines[0].split(' ').map(Number);
const cost = lines[1].split(' ').map(Number);

__USER_CODE__

console.log(canCompleteCircuit(gas, cost));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int gas[100001], cost[100001], n = 0, m = 0;
    char buf[2000000]; fgets(buf, sizeof(buf), stdin);
    char *p = buf; while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } gas[n++] = strtol(p, &p, 10); }
    fgets(buf, sizeof(buf), stdin); p = buf;
    while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } cost[m++] = strtol(p, &p, 10); }
    printf("%d\\n", canCompleteCircuit(gas, n, cost, m));
    return 0;
}`,
    },
    aiContext: 'Gas Station — greedy one-pass O(n)',
  },

  // ── 45. Rotate Array ─────────────────────────────────────────────────────────
  {
    number: 45, title: 'Rotate Array', slug: 'rotate-array', difficulty: 'Medium',
    tags: ['Array', 'Math', 'Two Pointers'], companies: ['Microsoft', 'Amazon', 'Bloomberg'],
    acceptance: 39.8, premium: false,
    description: `Given an integer array <code>nums</code>, rotate the array to the right by <code>k</code> steps.<br><br>First line: space-separated array. Second line: k.`,
    examples: [
      { input: '1 2 3 4 5 6 7\n3', output: '5 6 7 1 2 3 4' },
      { input: '-1 -100 3 99\n2',   output: '3 99 -1 -100'  },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '0 ≤ k ≤ 10⁵'],
    testCases: [
      { input: '1 2 3 4 5 6 7\n3', expected: '5 6 7 1 2 3 4', hidden: false },
      { input: '-1 -100 3 99\n2',   expected: '3 99 -1 -100',  hidden: false },
      { input: '1 2\n3',           expected: '2 1',            hidden: true  },
      { input: '1\n0',             expected: '1',              hidden: true  },
    ],
    hints: [
      'k = k % n to handle large k.',
      'Reverse the entire array.',
      'Then reverse first k elements, then reverse the rest.',
    ],
    starter: {
      cpp: `class Solution {
public:
    void rotate(vector<int>& nums, int k) {

    }
};`,
      python: `class Solution:
    def rotate(self, nums: List[int], k: int) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        `,
      java: `class Solution {
    public void rotate(int[] nums, int k) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var rotate = function(nums, k) {

};`,
      c: `void rotate(int* nums, int numsSize, int k) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string line; getline(cin, line);
    istringstream ss(line); vector<int> nums; int x;
    while (ss >> x) nums.push_back(x);
    int k; cin >> k;
    Solution sol; sol.rotate(nums, k);
    for (int i = 0; i < (int)nums.size(); i++) cout << (i ? " " : "") << nums[i];
    cout << endl; return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().split('\\n')
nums = list(map(int, lines[0].split()))
k = int(lines[1].strip())
Solution().rotate(nums, k)
print(*nums)`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        int k = sc.nextInt();
        new Solution().rotate(nums, k);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < nums.length; i++) sb.append(i > 0 ? " " : "").append(nums[i]);
        System.out.println(sb);
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const nums = lines[0].split(' ').map(Number);
const k = parseInt(lines[1]);

__USER_CODE__

rotate(nums, k);
console.log(nums.join(' '));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[100001], n = 0, k;
    char buf[2000000]; fgets(buf, sizeof(buf), stdin);
    char *p = buf; while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } nums[n++] = strtol(p, &p, 10); }
    scanf("%d", &k);
    rotate(nums, n, k);
    for (int i = 0; i < n; i++) printf("%s%d", i ? " " : "", nums[i]);
    printf("\\n"); return 0;
}`,
    },
    aiContext: 'Rotate Array — triple reverse O(n)',
  },

  // ── 46. Find All Anagrams in a String ────────────────────────────────────────
  {
    number: 46, title: 'Find All Anagrams in a String', slug: 'find-all-anagrams-in-a-string', difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Sliding Window'], companies: ['Facebook', 'Amazon', 'Google'],
    acceptance: 48.5, premium: false,
    description: `Given strings <code>s</code> and <code>p</code>, return all start indices of <code>p</code>'s anagrams in <code>s</code> (space-separated). Return empty line if none.<br><br>First line: s. Second line: p.`,
    examples: [
      { input: 'cbaebabacd\nabc', output: '0 6', explanation: 'Anagrams at index 0 and 6' },
      { input: 'abab\nab',       output: '0 1 2'                                           },
    ],
    constraints: ['1 ≤ s.length, p.length ≤ 3×10⁴', 's and p consist of lowercase English letters'],
    testCases: [
      { input: 'cbaebabacd\nabc', expected: '0 6',   hidden: false },
      { input: 'abab\nab',        expected: '0 1 2', hidden: false },
      { input: 'aa\nbb',          expected: '',       hidden: true  },
      { input: 'baa\naa',         expected: '1',      hidden: true  },
    ],
    hints: [
      'Use a sliding window of size len(p).',
      'Maintain character frequency counts for both the window and p.',
      'Slide the window and update counts incrementally.',
    ],
    starter: {
      cpp: `class Solution {
public:
    vector<int> findAnagrams(string s, string p) {

    }
};`,
      python: `class Solution:
    def findAnagrams(self, s: str, p: str) -> List[int]:
        `,
      java: `class Solution {
    public List<Integer> findAnagrams(String s, String p) {

    }
}`,
      javascript: `/**
 * @param {string} s
 * @param {string} p
 * @return {number[]}
 */
var findAnagrams = function(s, p) {

};`,
      c: `int* findAnagrams(char* s, char* p, int* returnSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string s, p; getline(cin, s); getline(cin, p);
    Solution sol;
    vector<int> res = sol.findAnagrams(s, p);
    for (int i = 0; i < (int)res.size(); i++) cout << (i ? " " : "") << res[i];
    cout << endl; return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
s, p = lines[0], lines[1]
print(*Solution().findAnagrams(s, p))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim(), p = sc.nextLine().trim();
        List<Integer> res = new Solution().findAnagrams(s, p);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < res.size(); i++) sb.append(i > 0 ? " " : "").append(res.get(i));
        System.out.println(sb);
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const s = lines[0], p = lines[1];

__USER_CODE__

console.log(findAnagrams(s, p).join(' '));`,
      c: `#include <stdio.h>
#include <string.h>

__USER_CODE__

int main() {
    char s[30001], p[30001];
    fgets(s, sizeof(s), stdin); fgets(p, sizeof(p), stdin);
    int ns = strlen(s), np = strlen(p);
    if (s[ns-1] == '\\n') s[--ns] = '\\0';
    if (p[np-1] == '\\n') p[--np] = '\\0';
    int retSize;
    int *res = findAnagrams(s, p, &retSize);
    for (int i = 0; i < retSize; i++) printf("%s%d", i ? " " : "", res[i]);
    printf("\\n"); return 0;
}`,
    },
    aiContext: 'Find All Anagrams — sliding window with freq array O(n)',
  },

  // ── 47. Letter Combinations of a Phone Number ────────────────────────────────
  {
    number: 47, title: 'Letter Combinations of a Phone Number', slug: 'letter-combinations-of-a-phone-number', difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Backtracking'], companies: ['Amazon', 'Google', 'Uber'],
    acceptance: 56.8, premium: false,
    description: `Given a string of digits 2-9, return all possible letter combinations.<br><br>Mapping: 2=abc, 3=def, 4=ghi, 5=jkl, 6=mno, 7=pqrs, 8=tuv, 9=wxyz.<br>Print each combination on a new line in lexicographic order.`,
    examples: [
      { input: '23', output: 'ad\nae\naf\nbd\nbe\nbf\ncd\nce\ncf' },
      { input: '2',  output: 'a\nb\nc'                             },
    ],
    constraints: ['0 ≤ digits.length ≤ 4', "digits[i] is in ['2','9']"],
    testCases: [
      { input: '23', expected: 'ad\nae\naf\nbd\nbe\nbf\ncd\nce\ncf', hidden: false },
      { input: '2',  expected: 'a\nb\nc',                            hidden: false },
      { input: '',   expected: '',                                   hidden: true  },
      { input: '9',  expected: 'w\nx\ny\nz',                        hidden: true  },
    ],
    hints: [
      'Map each digit to its corresponding letters.',
      'Use backtracking to build combinations character by character.',
      'Sort results for lexicographic output.',
    ],
    starter: {
      cpp: `class Solution {
public:
    vector<string> letterCombinations(string digits) {

    }
};`,
      python: `class Solution:
    def letterCombinations(self, digits: str) -> List[str]:
        `,
      java: `class Solution {
    public List<String> letterCombinations(String digits) {

    }
}`,
      javascript: `/**
 * @param {string} digits
 * @return {string[]}
 */
var letterCombinations = function(digits) {

};`,
      c: `char** letterCombinations(char* digits, int* returnSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string digits; getline(cin, digits);
    Solution sol;
    vector<string> res = sol.letterCombinations(digits);
    sort(res.begin(), res.end());
    for (auto& s : res) cout << s << "\\n";
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

digits = sys.stdin.read().strip()
res = Solution().letterCombinations(digits)
for s in sorted(res): print(s)`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        String digits = new Scanner(System.in).nextLine().trim();
        List<String> res = new Solution().letterCombinations(digits);
        Collections.sort(res);
        for (String s : res) System.out.println(s);
    }
}`,
      javascript: `const digits = require('fs').readFileSync('/dev/stdin','utf8').trim();

__USER_CODE__

const res = letterCombinations(digits);
if (res && res.length) res.sort().forEach(s => console.log(s));`,
      c: `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

__USER_CODE__

int cmpStr(const void *a, const void *b) { return strcmp(*(char**)a, *(char**)b); }

int main() {
    char digits[5]; if (scanf("%s", digits) != 1) { printf("\\n"); return 0; }
    int retSize;
    char **res = letterCombinations(digits, &retSize);
    if (retSize == 0) { printf("\\n"); return 0; }
    qsort(res, retSize, sizeof(char*), cmpStr);
    for (int i = 0; i < retSize; i++) printf("%s\\n", res[i]);
    return 0;
}`,
    },
    aiContext: 'Letter Combinations Phone Number — backtracking O(4^n)',
  },

  // ── 48. Contains Duplicate ───────────────────────────────────────────────────
  {
    number: 48, title: 'Contains Duplicate', slug: 'contains-duplicate', difficulty: 'Easy',
    tags: ['Array', 'Hash Table', 'Sorting'], companies: ['Amazon', 'Google', 'Apple'],
    acceptance: 61.4, premium: false,
    description: `Given an integer array <code>nums</code>, return <code>true</code> if any value appears <strong>at least twice</strong>, and <code>false</code> if every element is distinct.`,
    examples: [
      { input: 'nums = [1,2,3,1]',             output: 'true',  explanation: '1 appears twice' },
      { input: 'nums = [1,2,3,4]',             output: 'false', explanation: 'All distinct'     },
      { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', output: 'true'                                   },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁹ ≤ nums[i] ≤ 10⁹'],
    testCases: [
      { input: '1 2 3 1',             expected: 'true',  hidden: false },
      { input: '1 2 3 4',             expected: 'false', hidden: false },
      { input: '1 1 1 3 3 4 3 2 4 2', expected: 'true',  hidden: false },
      { input: '1',                   expected: 'false', hidden: true  },
      { input: '-1 -1',               expected: 'true',  hidden: true  },
    ],
    hints: [
      'Use a hash set to track numbers seen so far.',
      'If a number is already in the set, return true.',
      'Alternatively, sort the array and check adjacent elements.',
    ],
    starter: {
      cpp: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        `,
      java: `class Solution {
    public boolean containsDuplicate(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var containsDuplicate = function(nums) {

};`,
      c: `bool containsDuplicate(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    cout << (sol.containsDuplicate(nums) ? "true" : "false") << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(str(Solution().containsDuplicate(nums)).lower())`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().containsDuplicate(nums));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(String(containsDuplicate(nums)));`,
      c: `#include <stdio.h>
#include <stdbool.h>

__USER_CODE__

int main() {
    int nums[100001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    printf("%s\\n", containsDuplicate(nums, n) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Contains Duplicate — hash set O(n)',
  },

  // ── 49. LRU Cache ────────────────────────────────────────────────────────────
  {
    number: 49, title: 'LRU Cache', slug: 'lru-cache', difficulty: 'Hard',
    tags: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Facebook'], acceptance: 41.5, premium: false,
    description: `Design a data structure that follows the Least Recently Used (LRU) cache constraint.<br><br>Implement <code>LRUCache(capacity)</code>, <code>get(key)</code> (return -1 if not found), and <code>put(key, value)</code> (evict LRU if at capacity). Both must run in <code>O(1)</code>.<br><br>Input: first line is capacity, then operations (<code>get k</code> or <code>put k v</code>). Print result of each <code>get</code>.`,
    examples: [
      { input: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4', output: '1\n-1\n-1\n3\n4' },
    ],
    constraints: ['1 ≤ capacity ≤ 3000', '0 ≤ key ≤ 10⁴', '0 ≤ value ≤ 10⁵'],
    testCases: [
      { input: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4', expected: '1\n-1\n-1\n3\n4', hidden: false },
      { input: '1\nput 2 1\nget 2\nput 3 2\nget 2\nget 3',                                  expected: '1\n-1\n2',          hidden: true  },
      { input: '2\nput 1 10\nput 2 20\nget 1\nput 3 30\nget 2\nget 3',                     expected: '10\n-1\n30',        hidden: true  },
    ],
    hints: [
      'Use a HashMap + Doubly Linked List.',
      'HashMap gives O(1) access; DLL gives O(1) move-to-front.',
      'Keep dummy head and tail to simplify edge cases.',
    ],
    starter: {
      cpp: `class LRUCache {
public:
    LRUCache(int capacity) {

    }

    int get(int key) {

    }

    void put(int key, int value) {

    }
};`,
      python: `class LRUCache:

    def __init__(self, capacity: int):


    def get(self, key: int) -> int:


    def put(self, key: int, value: int) -> None:
        `,
      java: `class LRUCache {

    public LRUCache(int capacity) {

    }

    public int get(int key) {

    }

    public void put(int key, int value) {

    }
}`,
      javascript: `/**
 * @param {number} capacity
 */
var LRUCache = function(capacity) {

};

/**
 * @param {number} key
 * @return {number}
 */
LRUCache.prototype.get = function(key) {

};

/**
 * @param {number} key
 * @param {number} value
 * @return {void}
 */
LRUCache.prototype.put = function(key, value) {

};`,
      c: `typedef struct LRUCache LRUCache;

LRUCache* lRUCacheCreate(int capacity) {

}

int lRUCacheGet(LRUCache* obj, int key) {

}

void lRUCachePut(LRUCache* obj, int key, int value) {

}

void lRUCacheFree(LRUCache* obj) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    int cap; cin >> cap; cin.ignore();
    LRUCache cache(cap);
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        istringstream ss(line); string op; ss >> op;
        if (op == "get") { int k; ss >> k; cout << cache.get(k) << "\\n"; }
        else { int k, v; ss >> k >> v; cache.put(k, v); }
    }
    return 0;
}`,
      python: `import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
capacity = int(lines[0])
cache = LRUCache(capacity)
for line in lines[1:]:
    parts = line.split()
    if parts[0] == 'get': print(cache.get(int(parts[1])))
    else: cache.put(int(parts[1]), int(parts[2]))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int cap = sc.nextInt(); sc.nextLine();
        LRUCache cache = new LRUCache(cap);
        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim(); if (line.isEmpty()) continue;
            String[] parts = line.split(" ");
            if (parts[0].equals("get")) System.out.println(cache.get(Integer.parseInt(parts[1])));
            else cache.put(Integer.parseInt(parts[1]), Integer.parseInt(parts[2]));
        }
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const cap = parseInt(lines[0]);

__USER_CODE__

const cache = new LRUCache(cap);
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].trim().split(' ');
    if (parts[0] === 'get') console.log(cache.get(parseInt(parts[1])));
    else cache.put(parseInt(parts[1]), parseInt(parts[2]));
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

__USER_CODE__

int main() {
    int cap; scanf("%d", &cap);
    LRUCache* cache = lRUCacheCreate(cap);
    char op[4]; int k, v;
    while (scanf("%s", op) == 1) {
        if (op[0] == 'g') { scanf("%d", &k); printf("%d\\n", lRUCacheGet(cache, k)); }
        else { scanf("%d %d", &k, &v); lRUCachePut(cache, k, v); }
    }
    lRUCacheFree(cache); return 0;
}`,
    },
    aiContext: 'LRU Cache — HashMap + Doubly Linked List O(1) get/put',
  },

  // ── 50. Median of Two Sorted Arrays ──────────────────────────────────────────
  {
    number: 50, title: 'Median of Two Sorted Arrays', slug: 'median-of-two-sorted-arrays', difficulty: 'Hard',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    companies: ['Google', 'Amazon', 'Goldman Sachs'], acceptance: 36.2, premium: false,
    description: `Given two sorted arrays <code>nums1</code> and <code>nums2</code>, return the median of the two sorted arrays. The overall runtime complexity must be <code>O(log(m+n))</code>.<br><br>First line: nums1 (space-separated). Second line: nums2.`,
    examples: [
      { input: 'nums1 = [1,3], nums2 = [2]',    output: '2.00000' },
      { input: 'nums1 = [1,2], nums2 = [3,4]',  output: '2.50000' },
    ],
    constraints: ['0 ≤ m, n ≤ 1000', '1 ≤ m + n ≤ 2000', '-10⁶ ≤ nums1[i], nums2[i] ≤ 10⁶'],
    testCases: [
      { input: '1 3\n2',   expected: '2.00000', hidden: false },
      { input: '1 2\n3 4', expected: '2.50000', hidden: false },
      { input: '0 0\n0 0', expected: '0.00000', hidden: true  },
      { input: '2\n1 3',   expected: '2.00000', hidden: true  },
      { input: '\n1',      expected: '1.00000', hidden: true  },
    ],
    hints: [
      'Binary search on the smaller array.',
      'Partition both arrays so left half has (m+n+1)/2 elements.',
      'Ensure max(leftA, leftB) ≤ min(rightA, rightB).',
    ],
    starter: {
      cpp: `class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {

    }
};`,
      python: `class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        `,
      java: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
var findMedianSortedArrays = function(nums1, nums2) {

};`,
      c: `double findMedianSortedArrays(int* nums1, int nums1Size, int* nums2, int nums2Size) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string l1, l2; getline(cin, l1); getline(cin, l2);
    istringstream s1(l1), s2(l2);
    vector<int> nums1, nums2; int x;
    while (s1 >> x) nums1.push_back(x);
    while (s2 >> x) nums2.push_back(x);
    Solution sol;
    printf("%.5f\\n", sol.findMedianSortedArrays(nums1, nums2));
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

data = sys.stdin.read().split('\\n')
nums1 = list(map(int, data[0].split())) if data[0].strip() else []
nums2 = list(map(int, data[1].split())) if len(data) > 1 and data[1].strip() else []
print(f"{Solution().findMedianSortedArrays(nums1, nums2):.5f}")`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String l1 = sc.hasNextLine() ? sc.nextLine().trim() : "";
        String l2 = sc.hasNextLine() ? sc.nextLine().trim() : "";
        int[] nums1 = l1.isEmpty() ? new int[0] : Arrays.stream(l1.split(" ")).mapToInt(Integer::parseInt).toArray();
        int[] nums2 = l2.isEmpty() ? new int[0] : Arrays.stream(l2.split(" ")).mapToInt(Integer::parseInt).toArray();
        System.out.printf("%.5f%n", new Solution().findMedianSortedArrays(nums1, nums2));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const nums1 = lines[0] && lines[0].trim() ? lines[0].trim().split(' ').map(Number) : [];
const nums2 = lines[1] && lines[1].trim() ? lines[1].trim().split(' ').map(Number) : [];

__USER_CODE__

console.log(findMedianSortedArrays(nums1, nums2).toFixed(5));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int a[1001], b[1001], na = 0, nb = 0;
    char buf[10000];
    fgets(buf, sizeof(buf), stdin);
    char *p = buf; while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } a[na++] = strtol(p, &p, 10); }
    fgets(buf, sizeof(buf), stdin); p = buf;
    while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } b[nb++] = strtol(p, &p, 10); }
    printf("%.5f\\n", findMedianSortedArrays(a, na, b, nb));
    return 0;
}`,
    },
    aiContext: 'Median of Two Sorted Arrays — binary search O(log(min(m,n)))',
  },

  // ── PROBLEMS 51–60 ────────────────────────────────────────────────────────────
// Each problem has:
//   starter     → what the user sees in the editor (function signature only)
//   codeWrapper → full runnable code sent to Judge0 (__USER_CODE__ = user's class)

  // ── 51. Two Sum II - Input Array Is Sorted ───────────────────────────────────
  {
    number: 51, title: 'Two Sum II - Input Array Is Sorted', slug: 'two-sum-ii-input-array-is-sorted', difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Binary Search'], companies: ['Amazon', 'Apple', 'Bloomberg'],
    acceptance: 59.4, premium: false,
    description: `Given a 1-indexed sorted array of integers <code>numbers</code> and a target integer, return the indices of the two numbers that add up to target as <code>[index1, index2]</code> where <code>1 ≤ index1 &lt; index2</code>.<br><br>First line: space-separated numbers. Second line: target.`,
    examples: [
      { input: '2 7 11 15\n9',  output: '[1, 2]', explanation: 'numbers[1] + numbers[2] = 2 + 7 = 9' },
      { input: '2 3 4\n6',      output: '[1, 3]' },
      { input: '-1 0\n-1',      output: '[1, 2]' },
    ],
    constraints: ['2 ≤ n ≤ 3×10⁴', '-1000 ≤ numbers[i] ≤ 1000', 'Exactly one solution exists'],
    testCases: [
      { input: '2 7 11 15\n9', expected: '[1, 2]', hidden: false },
      { input: '2 3 4\n6',     expected: '[1, 3]', hidden: false },
      { input: '-1 0\n-1',     expected: '[1, 2]', hidden: false },
      { input: '1 2 3 4 5\n9', expected: '[4, 5]', hidden: true  },
      { input: '5 25 75\n100', expected: '[2, 3]', hidden: true  },
    ],
    hints: [
      'Use two pointers: one at the start, one at the end.',
      'If the sum is too small, move the left pointer right.',
      'If the sum is too large, move the right pointer left.',
    ],
    starter: {
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& numbers, int target) {

    }
};`,
      python: `class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        `,
      java: `class Solution {
    public int[] twoSum(int[] numbers, int target) {

    }
}`,
      javascript: `/**
 * @param {number[]} numbers
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(numbers, target) {

};`,
      c: `int* twoSum(int* numbers, int numbersSize, int target, int* returnSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string line; getline(cin, line);
    istringstream ss(line); vector<int> nums; int x;
    while (ss >> x) nums.push_back(x);
    int target; cin >> target;
    Solution sol;
    vector<int> res = sol.twoSum(nums, target);
    cout << "[" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

data = sys.stdin.read().split('\\n')
numbers = list(map(int, data[0].split()))
target = int(data[1].strip())
res = Solution().twoSum(numbers, target)
print(f"[{res[0]}, {res[1]}]")`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] numbers = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        int target = sc.nextInt();
        int[] res = new Solution().twoSum(numbers, target);
        System.out.println("[" + res[0] + ", " + res[1] + "]");
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const numbers = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);

__USER_CODE__

const res = twoSum(numbers, target);
console.log('[' + res[0] + ', ' + res[1] + ']');`,
      c: `#include <stdio.h>
#include <stdlib.h>

__USER_CODE__

int main() {
    int nums[30001], n = 0, target;
    char buf[200000]; fgets(buf, sizeof(buf), stdin);
    char *p = buf; while (*p && *p != '\\n') { if (*p == ' ') { p++; continue; } nums[n++] = strtol(p, &p, 10); }
    scanf("%d", &target);
    int retSize;
    int *res = twoSum(nums, n, target, &retSize);
    printf("[%d, %d]\\n", res[0], res[1]);
    free(res); return 0;
}`,
    },
    aiContext: 'Two Sum II - two pointers on sorted array O(n)',
  },

  // ── 52. Maximum Product Subarray ─────────────────────────────────────────────
  {
    number: 52, title: 'Maximum Product Subarray', slug: 'maximum-product-subarray', difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming'], companies: ['Amazon', 'LinkedIn', 'Apple'],
    acceptance: 34.8, premium: false,
    description: `Given an integer array <code>nums</code>, find a subarray that has the largest product and return the product.`,
    examples: [
      { input: 'nums = [2,3,-2,4]',    output: '6',  explanation: '[2,3] has the largest product 6' },
      { input: 'nums = [-2,0,-1]',     output: '0',  explanation: 'Result cannot be 2 because [-2,-1] is not a subarray' },
    ],
    constraints: ['1 ≤ nums.length ≤ 2×10⁴', '-10 ≤ nums[i] ≤ 10', 'Product guaranteed to fit in 32-bit integer'],
    testCases: [
      { input: '2 3 -2 4',  expected: '6',  hidden: false },
      { input: '-2 0 -1',   expected: '0',  hidden: false },
      { input: '-2',        expected: '-2', hidden: true  },
      { input: '0 2',       expected: '2',  hidden: true  },
      { input: '3 -1 4',    expected: '4',  hidden: true  },
    ],
    hints: [
      'Track both the current maximum and minimum product.',
      'A negative number can turn the minimum into the maximum.',
      'At each step: curMax = max(nums[i], curMax*nums[i], curMin*nums[i]).',
    ],
    starter: {
      cpp: `class Solution {
public:
    int maxProduct(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        `,
      java: `class Solution {
    public int maxProduct(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxProduct = function(nums) {

};`,
      c: `int maxProduct(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    cout << sol.maxProduct(nums) << endl;
    return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
print(Solution().maxProduct(nums))`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        System.out.println(new Solution().maxProduct(nums));
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

console.log(maxProduct(nums));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[20001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    printf("%d\\n", maxProduct(nums, n));
    return 0;
}`,
    },
    aiContext: 'Maximum Product Subarray — track min and max O(n)',
  },

  // ── 53. Min Stack ────────────────────────────────────────────────────────────
  {
    number: 53, title: 'Min Stack', slug: 'min-stack', difficulty: 'Medium',
    tags: ['Stack', 'Design'], companies: ['Amazon', 'Bloomberg', 'Google'],
    acceptance: 53.2, premium: false,
    description: `Design a stack that supports push, pop, top, and retrieving the minimum element, all in <code>O(1)</code>.<br><br>Input: operations one per line (<code>push v</code>, <code>pop</code>, <code>top</code>, <code>getMin</code>). Print result of <code>top</code> and <code>getMin</code>.`,
    examples: [
      { input: 'push -2\npush 0\npush -3\ngetMin\npop\ntop\ngetMin', output: '-3\n0\n-2' },
    ],
    constraints: ['-2³¹ ≤ val ≤ 2³¹-1', 'pop/top/getMin called on non-empty stack'],
    testCases: [
      { input: 'push -2\npush 0\npush -3\ngetMin\npop\ntop\ngetMin', expected: '-3\n0\n-2', hidden: false },
      { input: 'push 1\npush 2\ntop\ngetMin\npop\ngetMin',           expected: '2\n1\n1',   hidden: true  },
      { input: 'push 5\npush 3\npush 7\ngetMin\npop\ngetMin',        expected: '3\n3',      hidden: true  },
    ],
    hints: [
      'Use a second stack to track minimums.',
      'Push to min stack only when value ≤ current min.',
      'Pop from min stack when popping the current minimum.',
    ],
    starter: {
      cpp: `class MinStack {
public:
    MinStack() {

    }

    void push(int val) {

    }

    void pop() {

    }

    int top() {

    }

    int getMin() {

    }
};`,
      python: `class MinStack:

    def __init__(self):


    def push(self, val: int) -> None:


    def pop(self) -> None:


    def top(self) -> int:


    def getMin(self) -> int:
        `,
      java: `class MinStack {

    public MinStack() {

    }

    public void push(int val) {

    }

    public void pop() {

    }

    public int top() {

    }

    public int getMin() {

    }
}`,
      javascript: `var MinStack = function() {

};

/**
 * @param {number} val
 * @return {void}
 */
MinStack.prototype.push = function(val) {

};

/**
 * @return {void}
 */
MinStack.prototype.pop = function() {

};

/**
 * @return {number}
 */
MinStack.prototype.top = function() {

};

/**
 * @return {number}
 */
MinStack.prototype.getMin = function() {

};`,
      c: `typedef struct MinStack MinStack;

MinStack* minStackCreate() {

}

void minStackPush(MinStack* obj, int val) {

}

void minStackPop(MinStack* obj) {

}

int minStackTop(MinStack* obj) {

}

int minStackGetMin(MinStack* obj) {

}

void minStackFree(MinStack* obj) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    MinStack st;
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        if (line.substr(0,4) == "push") { int v = stoi(line.substr(5)); st.push(v); }
        else if (line == "pop")    st.pop();
        else if (line == "top")    cout << st.top()    << "\\n";
        else if (line == "getMin") cout << st.getMin() << "\\n";
    }
    return 0;
}`,
      python: `import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
st = MinStack()
for line in lines:
    parts = line.split()
    if parts[0] == 'push': st.push(int(parts[1]))
    elif parts[0] == 'pop': st.pop()
    elif parts[0] == 'top': print(st.top())
    elif parts[0] == 'getMin': print(st.getMin())`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        MinStack st = new MinStack();
        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim(); if (line.isEmpty()) continue;
            String[] parts = line.split(" ");
            if (parts[0].equals("push")) st.push(Integer.parseInt(parts[1]));
            else if (parts[0].equals("pop"))    st.pop();
            else if (parts[0].equals("top"))    System.out.println(st.top());
            else if (parts[0].equals("getMin")) System.out.println(st.getMin());
        }
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');

__USER_CODE__

const st = new MinStack();
for (const line of lines) {
    const parts = line.trim().split(' ');
    if (parts[0] === 'push') st.push(parseInt(parts[1]));
    else if (parts[0] === 'pop')    st.pop();
    else if (parts[0] === 'top')    console.log(st.top());
    else if (parts[0] === 'getMin') console.log(st.getMin());
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

__USER_CODE__

int main() {
    MinStack* st = minStackCreate();
    char line[50];
    while (fgets(line, sizeof(line), stdin)) {
        if (line[0] == '\\n') continue;
        if (strncmp(line, "push", 4) == 0) { int v = atoi(line+5); minStackPush(st, v); }
        else if (strncmp(line, "pop", 3) == 0)    minStackPop(st);
        else if (strncmp(line, "top", 3) == 0)    printf("%d\\n", minStackTop(st));
        else if (strncmp(line, "getMin", 6) == 0) printf("%d\\n", minStackGetMin(st));
    }
    minStackFree(st); return 0;
}`,
    },
    aiContext: 'Min Stack — auxiliary min stack O(1) all operations',
  },

  // ── 54. Implement Queue using Stacks ─────────────────────────────────────────
  {
    number: 54, title: 'Implement Queue using Stacks', slug: 'implement-queue-using-stacks', difficulty: 'Easy',
    tags: ['Stack', 'Design', 'Queue'], companies: ['Bloomberg', 'Microsoft', 'Amazon'],
    acceptance: 64.3, premium: false,
    description: `Implement a first-in-first-out queue using only two stacks.<br><br>Input: operations one per line (<code>push v</code>, <code>pop</code>, <code>peek</code>, <code>empty</code>). Print result of <code>pop</code>, <code>peek</code>, <code>empty</code>.`,
    examples: [
      { input: 'push 1\npush 2\npeek\npop\nempty', output: '1\n1\nfalse' },
    ],
    constraints: ['1 ≤ x ≤ 9', 'At most 100 calls', 'pop/peek called on non-empty queue'],
    testCases: [
      { input: 'push 1\npush 2\npeek\npop\nempty', expected: '1\n1\nfalse', hidden: false },
      { input: 'push 1\nempty\npop\nempty',         expected: 'false\n1\ntrue', hidden: true },
      { input: 'push 3\npush 5\npop\npeek',         expected: '3\n5',        hidden: true  },
    ],
    hints: [
      'Use two stacks: inbox and outbox.',
      'On push: push to inbox.',
      'On pop/peek: if outbox is empty, move all from inbox to outbox.',
    ],
    starter: {
      cpp: `class MyQueue {
public:
    MyQueue() {

    }

    void push(int x) {

    }

    int pop() {

    }

    int peek() {

    }

    bool empty() {

    }
};`,
      python: `class MyQueue:

    def __init__(self):


    def push(self, x: int) -> None:


    def pop(self) -> int:


    def peek(self) -> int:


    def empty(self) -> bool:
        `,
      java: `class MyQueue {

    public MyQueue() {

    }

    public void push(int x) {

    }

    public int pop() {

    }

    public int peek() {

    }

    public boolean empty() {

    }
}`,
      javascript: `var MyQueue = function() {

};

MyQueue.prototype.push = function(x) {

};

MyQueue.prototype.pop = function() {

};

MyQueue.prototype.peek = function() {

};

MyQueue.prototype.empty = function() {

};`,
      c: `typedef struct MyQueue MyQueue;

MyQueue* myQueueCreate() {

}

void myQueuePush(MyQueue* obj, int x) {

}

int myQueuePop(MyQueue* obj) {

}

int myQueuePeek(MyQueue* obj) {

}

bool myQueueEmpty(MyQueue* obj) {

}

void myQueueFree(MyQueue* obj) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    MyQueue q;
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        if (line.substr(0,4) == "push") { int v = stoi(line.substr(5)); q.push(v); }
        else if (line == "pop")   cout << q.pop()   << "\\n";
        else if (line == "peek")  cout << q.peek()  << "\\n";
        else if (line == "empty") cout << (q.empty() ? "true" : "false") << "\\n";
    }
    return 0;
}`,
      python: `import sys

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
q = MyQueue()
for line in lines:
    parts = line.split()
    if parts[0] == 'push': q.push(int(parts[1]))
    elif parts[0] == 'pop': print(q.pop())
    elif parts[0] == 'peek': print(q.peek())
    elif parts[0] == 'empty': print(str(q.empty()).lower())`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        MyQueue q = new MyQueue();
        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim(); if (line.isEmpty()) continue;
            String[] parts = line.split(" ");
            if (parts[0].equals("push")) q.push(Integer.parseInt(parts[1]));
            else if (parts[0].equals("pop"))   System.out.println(q.pop());
            else if (parts[0].equals("peek"))  System.out.println(q.peek());
            else if (parts[0].equals("empty")) System.out.println(q.empty());
        }
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');

__USER_CODE__

const q = new MyQueue();
for (const line of lines) {
    const parts = line.trim().split(' ');
    if (parts[0] === 'push') q.push(parseInt(parts[1]));
    else if (parts[0] === 'pop')   console.log(q.pop());
    else if (parts[0] === 'peek')  console.log(q.peek());
    else if (parts[0] === 'empty') console.log(String(q.empty()));
}`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

__USER_CODE__

int main() {
    MyQueue* q = myQueueCreate();
    char line[50];
    while (fgets(line, sizeof(line), stdin)) {
        if (line[0] == '\\n') continue;
        if (strncmp(line, "push", 4) == 0) { int v = atoi(line+5); myQueuePush(q, v); }
        else if (strncmp(line, "pop", 3) == 0)   printf("%d\\n", myQueuePop(q));
        else if (strncmp(line, "peek", 4) == 0)  printf("%d\\n", myQueuePeek(q));
        else if (strncmp(line, "empty", 5) == 0) printf("%s\\n", myQueueEmpty(q) ? "true" : "false");
    }
    myQueueFree(q); return 0;
}`,
    },
    aiContext: 'Implement Queue using Stacks — two stacks amortized O(1)',
  },

  // ── 55. Path Sum ─────────────────────────────────────────────────────────────
  {
    number: 55, title: 'Path Sum', slug: 'path-sum', difficulty: 'Easy',
    tags: ['Tree', 'DFS', 'BFS'], companies: ['Amazon', 'Microsoft', 'Adobe'],
    acceptance: 45.9, premium: false,
    description: `Given a binary tree in level-order (space-separated, use <code>null</code> for missing nodes) and a target sum, return <code>true</code> if the tree has a root-to-leaf path such that adding up all the values along the path equals <code>targetSum</code>.<br><br>First line: targetSum. Second line: level-order tree.`,
    examples: [
      { input: '22\n5 4 8 11 null 13 4 7 2 null null null 1', output: 'true', explanation: '5→4→11→2 = 22' },
      { input: '5\n1 2 3', output: 'false' },
      { input: '0\nnull',  output: 'false' },
    ],
    constraints: ['0 ≤ number of nodes ≤ 5000', '-1000 ≤ Node.val ≤ 1000', '-1000 ≤ targetSum ≤ 1000'],
    testCases: [
      { input: '22\n5 4 8 11 null 13 4 7 2 null null null 1', expected: 'true',  hidden: false },
      { input: '5\n1 2 3',                                    expected: 'false', hidden: false },
      { input: '0\nnull',                                     expected: 'false', hidden: true  },
      { input: '1\n1',                                        expected: 'true',  hidden: true  },
    ],
    hints: [
      'Use DFS: subtract node value from target at each step.',
      'At a leaf node, check if remaining target equals the leaf value.',
      'Return true if any path reaches zero at a leaf.',
    ],
    starter: {
      cpp: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 * };
 */
class Solution {
public:
    bool hasPathSum(TreeNode* root, int targetSum) {

    }
};`,
      python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:
        `,
      java: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 * }
 */
class Solution {
    public boolean hasPathSum(TreeNode root, int targetSum) {

    }
}`,
      javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @param {number} targetSum
 * @return {boolean}
 */
var hasPathSum = function(root, targetSum) {

};`,
      c: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     struct TreeNode *left;
 *     struct TreeNode *right;
 * };
 */
bool hasPathSum(struct TreeNode* root, int targetSum) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* build(vector<string>& v, int i) {
    if (i >= (int)v.size() || v[i] == "null") return nullptr;
    TreeNode* n = new TreeNode(stoi(v[i]));
    n->left = build(v, 2*i+1); n->right = build(v, 2*i+2);
    return n;
}

__USER_CODE__

int main() {
    int target; cin >> target;
    vector<string> vals; string s;
    while (cin >> s) vals.push_back(s);
    TreeNode* root = vals.empty() || vals[0] == "null" ? nullptr : build(vals, 0);
    Solution sol;
    cout << (sol.hasPathSum(root, target) ? "true" : "false") << endl;
    return 0;
}`,
      python: `from typing import Optional
from collections import deque
import sys

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def build(vals):
    if not vals or vals[0] == 'null': return None
    root = TreeNode(int(vals[0])); q = deque([root]); i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals) and vals[i] != 'null': node.left = TreeNode(int(vals[i])); q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] != 'null': node.right = TreeNode(int(vals[i])); q.append(node.right)
        i += 1
    return root

__USER_CODE__

lines = sys.stdin.read().strip().split('\\n')
target = int(lines[0])
vals = lines[1].split() if len(lines) > 1 else []
print(str(Solution().hasPathSum(build(vals), target)).lower())`,
      java: `import java.util.*;

class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int v) { val = v; }
}

__USER_CODE__

public class Main {
    static TreeNode build(String[] v, int i) {
        if (i >= v.length || v[i].equals("null")) return null;
        TreeNode n = new TreeNode(Integer.parseInt(v[i]));
        n.left = build(v, 2*i+1); n.right = build(v, 2*i+2);
        return n;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int target = sc.nextInt(); sc.nextLine();
        String[] vals = sc.hasNextLine() ? sc.nextLine().trim().split(" ") : new String[]{"null"};
        TreeNode root = vals[0].equals("null") ? null : build(vals, 0);
        System.out.println(new Solution().hasPathSum(root, target));
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const target = parseInt(lines[0]);
const vals = lines[1] ? lines[1].trim().split(/\\s+/) : [];

function TreeNode(val, left, right) { this.val = val ?? 0; this.left = left ?? null; this.right = right ?? null; }

function build(vals, i = 0) {
    if (i >= vals.length || vals[i] === 'null') return null;
    const n = new TreeNode(+vals[i]);
    n.left = build(vals, 2*i+1); n.right = build(vals, 2*i+2);
    return n;
}

__USER_CODE__

const root = !vals.length || vals[0] === 'null' ? null : build(vals);
console.log(String(hasPathSum(root, target)));`,
      c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

struct TreeNode { int val; struct TreeNode *left, *right; };
struct TreeNode* newNode(int v) { struct TreeNode* n = malloc(sizeof(struct TreeNode)); n->val=v; n->left=n->right=NULL; return n; }

struct TreeNode* build(char toks[][20], int n, int i) {
    if (i >= n || strcmp(toks[i], "null") == 0) return NULL;
    struct TreeNode* node = newNode(atoi(toks[i]));
    node->left = build(toks, n, 2*i+1); node->right = build(toks, n, 2*i+2);
    return node;
}

__USER_CODE__

int main() {
    int target; scanf("%d", &target);
    char toks[10000][20]; int tc = 0;
    while (scanf("%s", toks[tc]) == 1) tc++;
    struct TreeNode* root = (tc == 0 || strcmp(toks[0], "null") == 0) ? NULL : build(toks, tc, 0);
    printf("%s\\n", hasPathSum(root, target) ? "true" : "false");
    return 0;
}`,
    },
    aiContext: 'Path Sum — DFS root-to-leaf O(n)',
  },

  // ── 56. Merge Sorted Array ───────────────────────────────────────────────────
  {
    number: 56, title: 'Merge Sorted Array', slug: 'merge-sorted-array', difficulty: 'Easy',
    tags: ['Array', 'Two Pointers', 'Sorting'], companies: ['Facebook', 'Amazon', 'Microsoft'],
    acceptance: 47.1, premium: false,
    description: `Merge two sorted arrays <code>nums1</code> and <code>nums2</code> into <code>nums1</code> in-place. <code>nums1</code> has length <code>m + n</code> where the last <code>n</code> elements are 0 (placeholders).<br><br>Line 1: nums1 (m+n values). Line 2: m. Line 3: nums2 (n values). Line 4: n.`,
    examples: [
      { input: '1 2 3 0 0 0\n3\n2 5 6\n3', output: '1 2 2 3 5 6' },
      { input: '1\n1\n\n0',                 output: '1'            },
      { input: '0\n0\n1\n1',               output: '1'            },
    ],
    constraints: ['0 ≤ m, n ≤ 200', '1 ≤ m+n ≤ 200', '-10⁹ ≤ nums1[i], nums2[j] ≤ 10⁹'],
    testCases: [
      { input: '1 2 3 0 0 0\n3\n2 5 6\n3', expected: '1 2 2 3 5 6', hidden: false },
      { input: '1\n1\n\n0',                 expected: '1',            hidden: false },
      { input: '0\n0\n1\n1',               expected: '1',            hidden: true  },
      { input: '4 5 6 0 0 0\n3\n1 2 3\n3', expected: '1 2 3 4 5 6', hidden: true  },
    ],
    hints: [
      'Merge from the end to avoid overwriting elements.',
      'Use three pointers: i=m-1, j=n-1, k=m+n-1.',
      'Place the larger of nums1[i] and nums2[j] at nums1[k].',
    ],
    starter: {
      cpp: `class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {

    }
};`,
      python: `class Solution:
    def merge(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:
        """
        Do not return anything, modify nums1 in-place instead.
        """
        `,
      java: `class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums1
 * @param {number} m
 * @param {number[]} nums2
 * @param {number} n
 * @return {void}
 */
var merge = function(nums1, m, nums2, n) {

};`,
      c: `void merge(int* nums1, int nums1Size, int m, int* nums2, int nums2Size, int n) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    string line; getline(cin, line);
    istringstream ss(line); vector<int> nums1; int x;
    while (ss >> x) nums1.push_back(x);
    int m; cin >> m; cin.ignore();
    string line2; getline(cin, line2);
    istringstream ss2(line2); vector<int> nums2;
    while (ss2 >> x) nums2.push_back(x);
    int n; cin >> n;
    Solution sol; sol.merge(nums1, m, nums2, n);
    for (int i = 0; i < m+n; i++) cout << (i?" ":"") << nums1[i];
    cout << endl; return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

lines = sys.stdin.read().split('\\n')
nums1 = list(map(int, lines[0].split()))
m = int(lines[1])
nums2 = list(map(int, lines[2].split())) if lines[2].strip() else []
n = int(lines[3])
Solution().merge(nums1, m, nums2, n)
print(*nums1[:m+n])`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums1 = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        int m = sc.nextInt(); sc.nextLine();
        String l2 = sc.nextLine().trim();
        int[] nums2 = l2.isEmpty() ? new int[0] : Arrays.stream(l2.split(" ")).mapToInt(Integer::parseInt).toArray();
        int n = sc.nextInt();
        new Solution().merge(nums1, m, nums2, n);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < m+n; i++) sb.append(i>0?" ":"").append(nums1[i]);
        System.out.println(sb);
    }
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');
const nums1 = lines[0].trim().split(' ').map(Number);
const m = parseInt(lines[1]);
const nums2 = lines[2] && lines[2].trim() ? lines[2].trim().split(' ').map(Number) : [];
const n = parseInt(lines[3]);

__USER_CODE__

merge(nums1, m, nums2, n);
console.log(nums1.slice(0, m+n).join(' '));`,
      c: `#include <stdio.h>
#include <string.h>

__USER_CODE__

int main() {
    int nums1[401], nums2[201], m, n, idx = 0;
    char buf[500]; fgets(buf, sizeof(buf), stdin);
    char *p = buf; while (*p && *p != '\\n') { if (*p==' '){p++;continue;} nums1[idx++]=strtol(p,&p,10); }
    scanf("%d", &m); getchar();
    fgets(buf, sizeof(buf), stdin); p = buf; int idx2 = 0;
    while (*p && *p != '\\n') { if (*p==' '){p++;continue;} nums2[idx2++]=strtol(p,&p,10); }
    scanf("%d", &n);
    merge(nums1, idx, m, nums2, idx2, n);
    for (int i = 0; i < m+n; i++) printf("%s%d", i?" ":"", nums1[i]);
    printf("\\n"); return 0;
}`,
    },
    aiContext: 'Merge Sorted Array — merge from end O(m+n)',
  },

  // ── 57. Remove Duplicates from Sorted Array ───────────────────────────────────
  {
    number: 57, title: 'Remove Duplicates from Sorted Array', slug: 'remove-duplicates-from-sorted-array', difficulty: 'Easy',
    tags: ['Array', 'Two Pointers'], companies: ['Facebook', 'Microsoft', 'Bloomberg'],
    acceptance: 53.7, premium: false,
    description: `Given a sorted array <code>nums</code>, remove duplicates in-place such that each element appears only once. Return the number of unique elements <code>k</code>.<br><br>Print k followed by the first k elements of nums.`,
    examples: [
      { input: '1 1 2',         output: '2\n1 2'         },
      { input: '0 0 1 1 1 2 2 3 3 4', output: '5\n0 1 2 3 4' },
    ],
    constraints: ['1 ≤ nums.length ≤ 3×10⁴', '-100 ≤ nums[i] ≤ 100', 'nums is sorted in non-decreasing order'],
    testCases: [
      { input: '1 1 2',               expected: '2\n1 2',       hidden: false },
      { input: '0 0 1 1 1 2 2 3 3 4', expected: '5\n0 1 2 3 4', hidden: false },
      { input: '1',                   expected: '1\n1',          hidden: true  },
      { input: '1 2 3',               expected: '3\n1 2 3',      hidden: true  },
    ],
    hints: [
      'Use a slow pointer k to track the position of unique elements.',
      'Use a fast pointer i to scan through the array.',
      'When nums[i] != nums[k-1], copy nums[i] to nums[k] and increment k.',
    ],
    starter: {
      cpp: `class Solution {
public:
    int removeDuplicates(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        `,
      java: `class Solution {
    public int removeDuplicates(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var removeDuplicates = function(nums) {

};`,
      c: `int removeDuplicates(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol;
    int k = sol.removeDuplicates(nums);
    cout << k << "\\n";
    for (int i = 0; i < k; i++) cout << (i?" ":"") << nums[i];
    cout << endl; return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
k = Solution().removeDuplicates(nums)
print(k)
print(*nums[:k])`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        int k = new Solution().removeDuplicates(nums);
        System.out.println(k);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < k; i++) sb.append(i>0?" ":"").append(nums[i]);
        System.out.println(sb);
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

const k = removeDuplicates(nums);
console.log(k);
console.log(nums.slice(0, k).join(' '));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[30001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    int k = removeDuplicates(nums, n);
    printf("%d\\n", k);
    for (int i = 0; i < k; i++) printf("%s%d", i?" ":"", nums[i]);
    printf("\\n"); return 0;
}`,
    },
    aiContext: 'Remove Duplicates from Sorted Array — two pointers O(n)',
  },

  // ── 58. Move Zeroes ──────────────────────────────────────────────────────────
  {
    number: 58, title: 'Move Zeroes', slug: 'move-zeroes', difficulty: 'Easy',
    tags: ['Array', 'Two Pointers'], companies: ['Facebook', 'Bloomberg', 'Lyft'],
    acceptance: 61.2, premium: false,
    description: `Given an integer array <code>nums</code>, move all <code>0</code>s to the end while maintaining the relative order of the non-zero elements. Do this in-place.`,
    examples: [
      { input: 'nums = [0,1,0,3,12]', output: '1 3 12 0 0' },
      { input: 'nums = [0]',          output: '0'           },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁴', '-2³¹ ≤ nums[i] ≤ 2³¹-1'],
    testCases: [
      { input: '0 1 0 3 12', expected: '1 3 12 0 0', hidden: false },
      { input: '0',          expected: '0',           hidden: false },
      { input: '1',          expected: '1',           hidden: true  },
      { input: '0 0 1',      expected: '1 0 0',       hidden: true  },
      { input: '1 2 0 0 3',  expected: '1 2 3 0 0',  hidden: true  },
    ],
    hints: [
      'Use a pointer to track the position for the next non-zero element.',
      'Iterate: when you find a non-zero, swap it with the pointer position.',
      'All elements beyond the pointer position are zeros.',
    ],
    starter: {
      cpp: `class Solution {
public:
    void moveZeroes(vector<int>& nums) {

    }
};`,
      python: `class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        `,
      java: `class Solution {
    public void moveZeroes(int[] nums) {

    }
}`,
      javascript: `/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
var moveZeroes = function(nums) {

};`,
      c: `void moveZeroes(int* nums, int numsSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<int> nums; int x;
    while (cin >> x) nums.push_back(x);
    Solution sol; sol.moveZeroes(nums);
    for (int i = 0; i < (int)nums.size(); i++) cout << (i?" ":"") << nums[i];
    cout << endl; return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

nums = list(map(int, sys.stdin.read().split()))
Solution().moveZeroes(nums)
print(*nums)`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Integer> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(sc.nextInt());
        int[] nums = list.stream().mapToInt(i -> i).toArray();
        new Solution().moveZeroes(nums);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < nums.length; i++) sb.append(i>0?" ":"").append(nums[i]);
        System.out.println(sb);
    }
}`,
      javascript: `const nums = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/).map(Number);

__USER_CODE__

moveZeroes(nums);
console.log(nums.join(' '));`,
      c: `#include <stdio.h>

__USER_CODE__

int main() {
    int nums[10001], n = 0;
    while (scanf("%d", &nums[n]) == 1) n++;
    moveZeroes(nums, n);
    for (int i = 0; i < n; i++) printf("%s%d", i?" ":"", nums[i]);
    printf("\\n"); return 0;
}`,
    },
    aiContext: 'Move Zeroes — two pointer in-place O(n)',
  },

  // ── 59. Reverse String ───────────────────────────────────────────────────────
  {
    number: 59, title: 'Reverse String', slug: 'reverse-string', difficulty: 'Easy',
    tags: ['Two Pointers', 'String'], companies: ['Facebook', 'Google', 'Amazon'],
    acceptance: 75.6, premium: false,
    description: `Write a function that reverses a string. The input is given as an array of characters <code>s</code>. You must do this in-place with O(1) extra memory.<br><br>Input: space-separated characters. Output: reversed characters space-separated.`,
    examples: [
      { input: 'h e l l o',   output: 'o l l e h' },
      { input: 'H a n n a h', output: 'h a n n a H' },
    ],
    constraints: ['1 ≤ s.length ≤ 10⁵', 's[i] is a printable ASCII character'],
    testCases: [
      { input: 'h e l l o',   expected: 'o l l e h',   hidden: false },
      { input: 'H a n n a h', expected: 'h a n n a H', hidden: false },
      { input: 'A',           expected: 'A',            hidden: true  },
      { input: 'a b',         expected: 'b a',          hidden: true  },
    ],
    hints: [
      'Use two pointers: left and right.',
      'Swap characters at left and right, then move them toward each other.',
      'Stop when left >= right.',
    ],
    starter: {
      cpp: `class Solution {
public:
    void reverseString(vector<char>& s) {

    }
};`,
      python: `class Solution:
    def reverseString(self, s: List[str]) -> None:
        """
        Do not return anything, modify s in-place instead.
        """
        `,
      java: `class Solution {
    public void reverseString(char[] s) {

    }
}`,
      javascript: `/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
var reverseString = function(s) {

};`,
      c: `void reverseString(char* s, int sSize) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

__USER_CODE__

int main() {
    vector<char> s; string tok;
    while (cin >> tok) s.push_back(tok[0]);
    Solution sol; sol.reverseString(s);
    for (int i = 0; i < (int)s.size(); i++) cout << (i?" ":"") << s[i];
    cout << endl; return 0;
}`,
      python: `from typing import List
import sys

__USER_CODE__

s = sys.stdin.read().split()
Solution().reverseString(s)
print(*s)`,
      java: `import java.util.*;

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<Character> list = new ArrayList<>();
        while (sc.hasNext()) list.add(sc.next().charAt(0));
        char[] s = new char[list.size()];
        for (int i = 0; i < list.size(); i++) s[i] = list.get(i);
        new Solution().reverseString(s);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length; i++) sb.append(i>0?" ":"").append(s[i]);
        System.out.println(sb);
    }
}`,
      javascript: `const s = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/);

__USER_CODE__

reverseString(s);
console.log(s.join(' '));`,
      c: `#include <stdio.h>
#include <string.h>

__USER_CODE__

int main() {
    char toks[100001][3]; int n = 0;
    while (scanf("%s", toks[n]) == 1) n++;
    char s[100001]; for (int i = 0; i < n; i++) s[i] = toks[i][0];
    reverseString(s, n);
    for (int i = 0; i < n; i++) printf("%s%c", i?" ":"", s[i]);
    printf("\\n"); return 0;
}`,
    },
    aiContext: 'Reverse String — two pointer swap O(n)',
  },

  // ── 60. First Bad Version ────────────────────────────────────────────────────
  {
    number: 60, title: 'First Bad Version', slug: 'first-bad-version', difficulty: 'Easy',
    tags: ['Binary Search', 'Interactive'], companies: ['Facebook', 'Google', 'Amazon'],
    acceptance: 43.5, premium: false,
    description: `You are a product manager trying to find the first bad version. You have <code>n</code> versions and an API <code>isBadVersion(version)</code> that returns whether a version is bad. Find the first bad version with minimum API calls.<br><br>Input: first line is n, second line is bad (the first bad version).`,
    examples: [
      { input: '5\n4', output: '4', explanation: 'versions 4 and 5 are bad' },
      { input: '1\n1', output: '1' },
    ],
    constraints: ['1 ≤ bad ≤ n ≤ 2³¹-1'],
    testCases: [
      { input: '5\n4',          expected: '4', hidden: false },
      { input: '1\n1',          expected: '1', hidden: false },
      { input: '10\n1',         expected: '1', hidden: true  },
      { input: '100\n50',       expected: '50', hidden: true },
      { input: '2147483647\n2147483647', expected: '2147483647', hidden: true },
    ],
    hints: [
      'Binary search: if isBadVersion(mid) is true, the first bad is ≤ mid.',
      'Otherwise the first bad is > mid.',
      'Watch out for integer overflow when computing mid.',
    ],
    starter: {
      cpp: `// The API isBadVersion is defined for you.
// bool isBadVersion(int version);

class Solution {
public:
    int firstBadVersion(int n) {

    }
};`,
      python: `# The isBadVersion API is already defined for you.
# def isBadVersion(version: int) -> bool:

class Solution:
    def firstBadVersion(self, n: int) -> int:
        `,
      java: `/* The isBadVersion API is defined in the parent class VersionControl.
      boolean isBadVersion(int version); */

public class Solution extends VersionControl {
    public int firstBadVersion(int n) {

    }
}`,
      javascript: `/**
 * Definition for isBadVersion()
 * @param {integer} version number
 * @return {boolean} whether the version is bad
 * isBadVersion = function(version) { ... };
 */

/**
 * @param {function} isBadVersion()
 * @return {function}
 */
var solution = function(isBadVersion) {
    return function(n) {

    };
};`,
      c: `// The API isBadVersion is defined for you.
// bool isBadVersion(int version);

int firstBadVersion(int n) {

}`,
    },
    codeWrapper: {
      cpp: `#include <bits/stdc++.h>
using namespace std;

int BAD;
bool isBadVersion(int v) { return v >= BAD; }

__USER_CODE__

int main() {
    int n; cin >> n >> BAD;
    Solution sol;
    cout << sol.firstBadVersion(n) << endl;
    return 0;
}`,
      python: `import sys

data = sys.stdin.read().split()
n, BAD = int(data[0]), int(data[1])

def isBadVersion(v): return v >= BAD

__USER_CODE__

print(Solution().firstBadVersion(n))`,
      java: `import java.util.*;

class VersionControl {
    static int BAD;
    boolean isBadVersion(int v) { return v >= BAD; }
}

__USER_CODE__

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt(); VersionControl.BAD = sc.nextInt();
        System.out.println(new Solution().firstBadVersion(n));
    }
}`,
      javascript: `const data = require('fs').readFileSync('/dev/stdin','utf8').trim().split(/\\s+/);
const n = parseInt(data[0]), BAD = parseInt(data[1]);

const isBadVersion = v => v >= BAD;

__USER_CODE__

console.log(solution(isBadVersion)(n));`,
      c: `#include <stdio.h>
#include <stdbool.h>

int BAD;
bool isBadVersion(int v) { return v >= BAD; }

__USER_CODE__

int main() {
    int n; scanf("%d %d", &n, &BAD);
    printf("%d\\n", firstBadVersion(n));
    return 0;
}`,
    },
    aiContext: 'First Bad Version — binary search O(log n)',
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
