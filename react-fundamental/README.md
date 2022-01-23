# React Fundamentals

## 01 - Basic JavaScript-rendered Hello World

- create a div to show Hello World and append it in root element
- normal work flow of react
- create own root element and append it in body
- react portal
- [script attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attributes)
- [js modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [js append](https://developer.mozilla.org/en-US/docs/Web/API/Element/append)

## 02 - Intro to raw React APIs

- use static url script of React and ReactDOM from unpkg.com
- unpkg serves packages in npm as a static url
- it creates global variables React and ReactDOM
- React: responsible for creating React elements (kinda like
  document.createElement()) -ReactDOM: responsible for rendering React elements
  to the DOM (kinda like rootElement.append())
- React abstracts away imperative and gives declarative approach
- separating packages for multiple platforms like ReactNative
- for nested elements, React.createElement accepts multiple arguments (type,
  config, children1, children2,...)
- Value of children is starting from third argument
- children props can be array if multiple values are provided
- [react source code](https://github.com/facebook/react/blob/48907797294340b6d5d8fecfbcf97edf0691888d/packages/react-dom/src/client/ReactDOMComponent.js#L416)
- [imperative vs declarative](https://ui.dev/imperative-vs-declarative-programming)

## 03 - JSX

- JSX is a HTML-like syntactic sugar for on top of the raw React API
- JSX is not actually JavaScript, you have to convert it using something called
  a code compiler (Babel)
