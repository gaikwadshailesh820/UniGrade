<div align="center">

# 🎓 UniGrade

**A web-based SGPA & CGPA calculator with flexible, customizable grading systems.**

![Status](https://img.shields.io/badge/status-V1.0-brightgreen)
![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JavaScript-blue)
![Roadmap](https://img.shields.io/badge/next-React%20V2-orange)

</div>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Grading Systems](#grading-systems)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Version Info](#version-info)
- [Roadmap](#roadmap)
- [Vision](#vision)
- [Support the Project](#support-the-project)

---

## About

Calculating SGPA and CGPA gets confusing fast when subjects carry different credits, marks, and grading rules. **UniGrade** removes that friction — enter your academic data and get accurate SGPA/CGPA results instantly, without manual computation.

UniGrade currently ships with a grading configuration modeled on **DY Patil International University (DYPIU)**, alongside a fully customizable framework so users aren't locked into one evaluation scheme.

> **Current release:** V1 — HTML/CSS/JavaScript implementation
> **Next up:** V2 — a React rebuild with multi-university support ([see roadmap](#roadmap))

---

## Features

### 🧮 SGPA Calculator
Computes Semester GPA from subject-wise marks, credits, and the selected grading system — automatically resolving the correct grade and grade point per subject.

### 📊 CGPA Calculator
Aggregates semester performance into a credit-weighted CGPA, so students can track overall academic standing across terms.

### 🔐 Academic Management
Supporting functionality for running the full grading workflow:
- Faculty & institution records
- Student & subject records
- Marks entry and management
- Grading-system configuration
- Data export

---

## Grading Systems

UniGrade supports two grading models, both fully customizable.

| | Fixed / Absolute Grading | Relative Grading |
|---|---|---|
| **Basis** | Percentage / mark ranges | Z-score ranges |
| **Use existing system** | ✅ | ✅ |
| **Create custom system** | ✅ | ✅ |
| **Add/remove grade rules** | ✅ | ✅ |
| **Configure grade & grade point** | ✅ | ✅ |
| **Save & reuse** | ✅ | ✅ |

This dual-model, rule-based design means UniGrade isn't tied to a single evaluation scheme — new grading logic can be defined without touching the core calculator.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 |
| Logic | JavaScript |

---

## Project Structure

```text
UniGrade/
│
├── index.html          # Entry point
├── /css                # Stylesheets
├── /js                 # Application logic & calculations
└── README.md
```

---

## Version Info

| Detail | Value |
|---|---|
| Current version | V1.0 |
| Technology | HTML • CSS • JavaScript |
| Project type | Web application |
| Primary purpose | SGPA & CGPA calculation |
| Grading support | Fixed/Absolute & Relative |
| Custom grading | Supported |
| Default evaluation config | DYPIU-based |
| Next version | V2 (React) |

---

## Roadmap

| Version | Status | Description |
|---|---|---|
| **V1.0** | 🟢 Current | HTML, CSS & JavaScript implementation |
| **V1.x** | 🔄 Possible | Bug fixes and incremental improvements |
| **V2.0** | 🔮 Planned | React-based rebuild |
| **V2.x** | 🔮 Planned | Expanded universal & multi-university grading support |

### What's planned for V2

**⚛️ React Rebuild**
Reusable components, better state/data management, and a more maintainable architecture overall.

**🌍 Universal Grading Support**
Support for more universities, institution-specific evaluation schemes, custom grade-point mappings, and flexible academic structures.

**📊 Advanced Academic Features**
Multi-semester CGPA tracking, saved calculations, academic performance history, and richer reports.

**👨‍🏫 Teacher / Institution Tools**
Grading scheme configuration, institution-specific rules, and grade management at scale.

**🚀 Production Readiness**
Stronger input validation, error handling, performance tuning, testing, and improved security.

---

## Vision

Different institutions use different grading scales, credit structures, and evaluation methods. UniGrade is built around a flexible grading architecture — rather than one fixed scheme — so it can grow into a **universal academic calculation platform**.

**Simple → Accurate → Flexible → Universal**

---

## Support the Project

If you find UniGrade useful, consider giving the repo a ⭐ — more updates and the React-based V2 are on the way.