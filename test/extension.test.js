/* global suite, test */

//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
var assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
var vscode = require('vscode');
var myExtension = require('../extension');

// Defines a Mocha test suite to group tests of similar kind together
suite("Output parsing test", function () {
    test("test 1", function () {
        var tv = [
            "src\\game\\main.cc:11:11: note: place parentheses around the assignment to silence this warning",
            "src\\game\\main.cc:11:11: note: use '==' to turn this assignment into an equality comparison",
            "src\\game\\main.cc:16:11: note: place parentheses around the assignment to silence this warning",
            "src\\game\\main.cc:16:11: note: use '==' to turn this assignment into an equality comparison"
        ];

    });

    test("test 2", function () {
        var tv = [
            "src\\game\\main.cc:11:11:{11:7-11:21}: warning: using the result of an assignment as a condition without parentheses [-Wparentheses]",
            "src\\game\\main.cc:16:11:{16:7-16:30}: warning: using the result of an assignment as a condition without parentheses [-Wparentheses]",
        ];

    });

    test("test 3", function () {
        var tv = [
            "src\\game\\main.cc:11:11:{11:7-11:21}: warning: using the result of an assignment as a condition without parentheses [-Wparentheses]",
            "src\\game\\main.cc:11:11: note: place parentheses around the assignment to silence this warning",
            "src\\game\\main.cc:11:11: note: use '==' to turn this assignment into an equality comparison",
            "src\\game\\main.cc:16:11:{16:7-16:30}: warning: using the result of an assignment as a condition without parentheses [-Wparentheses]",
            "src\\game\\main.cc:16:11: note: place parentheses around the assignment to silence this warning",
            "src\\game\\main.cc:16:11: note: use '==' to turn this assignment into an equality comparison"
        ];
    });
});