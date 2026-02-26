# AB-Carousel Vanilla JS v2.3

Premium, ultra-lightweight (zero dependencies), and extremely smooth carousel component built with pure JavaScript and CSS.

![Version](https://img.shields.io/badge/version-2.3.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Size](https://img.shields.io/badge/size-%3C%205KB%20gz-orange.svg)

## ✨ Features

- ⚡ **Ultra-Lightweight**: Less than 5KB gzipped.
- 🚀 **Performance Optimized**: Uses Hardware Acceleration (GPU) and `requestAnimationFrame` for 60fps smoothing.
- 📱 **Touch Ready**: Native swipe support for mobile devices.
- 🔄 **Inifnite Loop**: Seamless infinite scrolling logic.
- 🎯 **Center Mode**: "Netflix-style" focus on the central element.
- ⚙️ **Smart Autoplay**: Pauses when not visible or during user interaction.
- 📱 **Fully Responsive**: Easy breakpoints configuration via data-attributes.
- 🎨 **Agnostic Design**: Structural CSS only. Style it however you want!

## 🚀 Quick Start

### 1. Include files
```html
<link rel="stylesheet" href="ab-carousel.min.css">
<script src="ab-carousel.min.js"></script>
```

### 2. Basic Structure
```html
<div class="ab-carousel" data-slides="3" data-autoplay="true" data-loop="true">
    <div>Slide 1</div>
    <div>Slide 2</div>
    <div>Slide 3</div>
    <div>Slide 4</div>
</div>
```

## 🛠 Configuration (Data Attributes)

| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-slides` | Number of slides to show. | `1` |
| `data-autoplay` | Enable auto-sliding. | `false` |
| `data-duration` | Time between slides (ms). | `3000` |
| `data-center` | Enable center focus mode. | `false` |
| `data-loop` | Infinite loop. | `true` |
| `data-gap` | Space between slides (px). | `20` |
| `data-nav` | Show/Hide default arrows. | `true` |
| `data-dots` | Show/Hide default dots. | `true` |
| `data-responsive` | Breakpoints JSON. | `null` |

## 🧩 External Controls
You can link any external HTML element using CSS selectors:
- `data-nav-prev="#my-prev"`
- `data-nav-next="#my-next"`
- `data-dots-container="#my-dots"`

---
Developed with ❤️ by **ABLY PERU | Alejandro Ttupa Quispe**
[ably.com.pe](https://ably.com.pe)
