---
published: false
title: "Read-only fixture: raw HTML block"
description: "A post the in-place editor cannot represent, used to check the safety lock."
date: 2026-01-15
author: "AI Impact Registry team"
tags: ["fixture", "read-only"]
image: "/blog/read-only-fixture/cover-00000000.png"
---

This fixture exists to check the editor's safety lock. It contains a raw HTML block, which the editor cannot represent.

<details>
<summary>How this works</summary>
The in-place editor round-trips the body through its own parser. Raw HTML has no equivalent there, so the rendered HTML would change on save.
</details>

The paragraph after the block.
