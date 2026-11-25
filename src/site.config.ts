export const SITE = {
  title: 'xuanworld',
  tagline: 'AI Security, Android Internals & Systems Engineering',
  description:
    'Engineering notes by RytterMohn on LLM red teaming, mobile AI agents, WAF security, and Android reverse engineering.',
  author: 'RytterMohn',
  siteUrl: 'https://en.xuanworld.top',
  zhSiteUrl: 'https://www.xuanworld.top/',
  githubUrl: 'https://github.com/RytterMohn',
  email: 'ryttermohn@gmail.com',
} as const;

export interface ProjectItem {
  name: string;
  area: string;
  repo: string;
  summary: string;
  highlight?: string;
}

export const PROJECTS: ProjectItem[] = [
  {
    name: 'LifeBuddy',
    area: 'AI Agents',
    repo: 'https://github.com/RytterMohn/LifeBuddy',
    summary:
      'Bilingual Android AI assistant with accessibility-driven automation, file-backed UI inspection (read/grep), persistent memory, learned skills, and MCP tool integration.',
    highlight: 'Featured',
  },
  {
    name: 'EnvScope',
    area: 'Android Security',
    repo: 'https://github.com/RytterMohn/EnvScope',
    summary:
      'Android runtime self-check APK combining Kotlin and native C++ cross-checks for Frida, Xposed/LSPosed, Riru, Zygisk/Magisk, and hook artifacts.',
    highlight: '45★',
  },
  {
    name: 'UsbDetectionBypass',
    area: 'Android Security',
    repo: 'https://github.com/RytterMohn/UsbDetectionBypass',
    summary:
      'LSPosed/Xposed module that masks USB connection and USB debugging detection signals inside Android applications.',
    highlight: '44★',
  },
  {
    name: 'EasyHook',
    area: 'Android Reverse',
    repo: 'https://github.com/RytterMohn/EasyHook',
    summary:
      'Windows desktop IDE for Android Frida scripts supporting device management, attach/spawn injection, script editing, and live logs.',
    highlight: '40★',
  },
  {
    name: 'APKAgents',
    area: 'AI Security',
    repo: 'https://github.com/RytterMohn/APKAgents',
    summary:
      'Multi-agent automated APK security analysis, vulnerability scanning, and reporting pipeline built on LangChain and CrewAI.',
  },
  {
    name: 'Native-Code-Malware-Detection',
    area: 'AI Security',
    repo: 'https://github.com/RytterMohn/Native-Code-Malware-Detection',
    summary:
      'RNN-based Android malware detector combining Java and native runtime API call sequences with permission features.',
  },
];

export const OSS_HIGHLIGHTS = [
  {
    project: 'Elasticsearch',
    url: 'https://github.com/elastic/elasticsearch/pull/166303',
    pr: '#166303',
    note: 'Added mutation coverage tests for field mapping responses.',
  },
  {
    project: 'Apache OpenNLP',
    url: 'https://github.com/apache/opennlp/pull/1591',
    pr: '#1591 / #1592',
    note: 'Unified UnicodeWhitespace newline handling when keepNewLines is enabled and backported to 2.x.',
  },
  {
    project: 'NVIDIA ccluster',
    url: 'https://github.com/NVIDIA/ccluster/pull/304',
    pr: '#304',
    note: 'Fixed error reporting when checking control planes without the ccluster API enabled.',
  },
  {
    project: 'NVIDIA Garak & Microsoft PyRIT',
    url: 'https://github.com/RytterMohn',
    pr: 'LLM Red Teaming',
    note: 'Fixes across WebSocket credential scanning, PromptShield XML parsing, CrescendoAttack refusal scoring, and bootstrap CI math.',
  },
  {
    project: 'OWASP Coraza WAF',
    url: 'https://github.com/corazawaf/coraza',
    pr: 'WAF Engine',
    note: 'Hardening audit logging, SecResponseBodyMimeType parsing, Phase 3 interception, and RuleGroup isolation.',
  },
];
