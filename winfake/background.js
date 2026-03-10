// Modify HTTP headers

var target_urls = [
  "https://*.nta.go.jp/*",
  "https://www.whatsmyua.info/*",
];

var new_ua = undefined;
async function updateRules() {
  if (new_ua !== undefined)
    return;

  new_ua = navigator.userAgent.replace(/X11; Linux x86_64/, "Windows NT 10.0; Win64; x64");

  // Get arrays containing new and old rules
  const newRules = [
    {
      "id": 1,
      "priority": 1,
      "action": {
        "type": "modifyHeaders",
        "requestHeaders": [
          { "header": "User-Agent", "operation": "set", "value": new_ua },
          { "header": "Sec-Ch-Ua-Platform", "operation": "set", "value": 'Windows' },
        ],
      },
      "condition": {
        "requestDomains": ["nta.go.jp", "www.whatsmyua.info"],
        "resourceTypes": ["main_frame", "sub_frame"],
      }
    }
  ]
  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map(rule => rule.id);

  console.log("Removing rules", oldRules);

  // Use the arrays to update the dynamic rules
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRuleIds,
    addRules: newRules
  });
}

updateRules();
