# Object Identification Guide

## Purpose

The purpose of this page is to provide a central place to keep track of object identifiers (tags, buttons, inputs, etc.) so that AI agents can locate elements and perform actions. The idea is to provide unique identifiers for buttons, text inputs, textareas, selects, and other interactive elements. We can then build a sequence player that can:

- Navigate to pages
- Highlight items
- Select items
- Perform click actions
- Get values back from items

This enables us to demonstrate a set of actions step by step or guide users on how to use specific functions.

## Element Types and Identification Strategy

### Interactive Elements to Track

1. **Buttons** - All clickable buttons with unique `data-testid` or `id` attributes
2. **Text Inputs** - Input fields for user text entry
3. **Textareas** - Multi-line text input areas
4. **Select Dropdowns** - Dropdown selection menus
5. **Checkboxes** - Boolean selection inputs
6. **Radio Buttons** - Single selection from multiple options
7. **Links** - Navigation links and action links
8. **Modal Triggers** - Elements that open/close modals
9. **Tab Navigation** - Tab switching elements
10. **Form Elements** - Complete forms and their submit buttons

### Identification Attributes

Each trackable element should have one or more of the following attributes:

- `data-id` - Primary identifier for automated testing and AI navigation
- `id` - Unique HTML ID when appropriate
- `aria-label` - Accessibility label that can serve as identifier
- `data-action` - Custom attribute describing the element's action
- `className` - Specific CSS classes for styling-based identification

## Implementation Guidelines

### `data-id` Naming Convention

Data Use descriptive, hierarchical naming for identifiers:

`[btn|label|input|textarea]-[function]`

### Object Identification Syntax

- Path by data-id: `@[page_url]:<dataid:data-id>`
- Path by HTML id: `@[page_url]:<id:element-id>`
- Path by CSS selector: `@[page_url]:<css:selector>[index]`

Example
```
@[/]:<dataid:btn-launch-graphic>
```

## Remember table

### Home
- Route: /
- Items:
    - btn-launch-graphic : Button to launch graphic overview
        - Path: `@[/]:<dataid:btn-launch-graphic>`
    - btn-launch-documentation: Button to launch documentation
        - Path: `@[/]:<dataid:btn-launch-documentation>`
    - btn-launch-video: Button to launch video content
        - Path: `@[/]:<dataid:btn-launch-video>`
    - btn-launch-vehicle-models: Button to launch vehicle models catalog
        - Path: `@[/]:<dataid:btn-launch-vehicle-models>`

Same code to navigate to correct route, find item and perform actions on it
```js
let action = {
    path: `@[/]:<dataid:btn-launch-vehicle-models>`,
    actionType: 'click',
    value: null
}

performAction(action)

async function performAction(action) {
    // Parse the action path to extract route and identifier
    return await executeAction(action);

    function parseActionPath(actionPath) {
        const pathMatch = actionPath.match(/@\[([^\]]+)\]:<([^:]+):([^>]+)>/);
        if (!pathMatch) {
            throw new Error('Invalid action path format');
        }
        const [, targetRoute, identifierType, identifierValue] = pathMatch;
        return { targetRoute, identifierType, identifierValue };
    }

    async function navigateToRoute(targetRoute) {
        const currentPath = window.location.pathname;
        if (currentPath !== targetRoute) {
            window.location.href = targetRoute;
            await waitForNavigation(targetRoute);
        }
    }

    async function waitForNavigation(targetRoute) {
        return new Promise(resolve => {
            const checkNavigation = () => {
                if (window.location.pathname === targetRoute) {
                    resolve();
                } else {
                    setTimeout(checkNavigation, 100);
                }
            };
            checkNavigation();
        });
    }

    async function waitForPageLoad() {
        await new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve, { once: true });
            }
        });
        
        // Additional wait for dynamic content to load
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    function findElement(identifierType, identifierValue) {
        let targetElement = null;
        
        switch (identifierType) {
            case 'dataid':
                targetElement = document.querySelector(`[data-id="${identifierValue}"]`);
                break;
            case 'id':
                targetElement = document.getElementById(identifierValue);
                break;
            case 'css':
                targetElement = findElementByCSS(identifierValue);
                break;
            default:
                throw new Error(`Unsupported identifier type: ${identifierType}`);
        }
        
        if (!targetElement) {
            throw new Error(`Element not found: ${identifierType}:${identifierValue}`);
        }
        
        return targetElement;
    }

    function findElementByCSS(identifierValue) {
        const indexMatch = identifierValue.match(/^(.+)\[(\d+)\]$/);
        if (indexMatch) {
            const [, selector, index] = indexMatch;
            const elements = document.querySelectorAll(selector);
            return elements[parseInt(index)];
        } else {
            return document.querySelector(identifierValue);
        }
    }

    function performElementAction(element, actionType, value) {
        switch (actionType) {
            case 'click':
                element.click();
                break;
            case 'focus':
                element.focus();
                break;
            case 'hover':
                const hoverEvent = new MouseEvent('mouseover', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(hoverEvent);
                break;
            case 'input':
                if (value !== undefined) {
                    element.value = value;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                }
                break;
            default:
                throw new Error(`Unsupported action type: ${actionType}`);
        }
    }

    async function executeAction(action) {
        const { targetRoute, identifierType, identifierValue } = parseActionPath(action.path);
        
        await navigateToRoute(targetRoute);
        await waitForPageLoad();
        
        const targetElement = findElement(identifierType, identifierValue);
        performElementAction(targetElement, action.actionType, action.value);
    }
}
```
