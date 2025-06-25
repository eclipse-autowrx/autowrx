import tippy, { Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import 'tippy.js/animations/perspective.css';


// Types for the automation service
interface ActionPath {
  targetRoute: string;
  identifierType: string;
  identifierValue: string;
}

interface Action {
  name: string;
  path: string;
  actionType: 'click' | 'input' | 'show_tooltip' | 'hide_tooltip';
  status?: 'not_started' | 'in_progress' | 'finished';
  finish_condition?: {
    type: 'element_exists' | 'element_not_exists' | 'element_visible' | 'element_invisible' | 'location-match' | 'text_contains' | 'text_not_contains' | 'automatic' | 'element_clicked';
    expectedValue?: any;
    target_element_path?: string;
  }
  value?: string | null;
  tooltipMessage?: string;
  delayBefore?: number;
  delayAfter?: number;
  autoHideAfter?: number;
}

/* Sample action
let action: Action = {
    path: `@[/]:<dataid:btn-launch-vehicle-models>`,
    actionType: 'click',
    value: null,
    delayBefore: 1000,
    delayAfter: 1000
}

// Sample series of actions
const sampleActionSequence: Action[] = [
    {
        path: `@[/]:<dataid:btn-launch-graphic>`,
        actionType: 'click',
        value: null,
        delayBefore: 1000,
        delayAfter: 1000
    },
    {
        path: `@[/]:<dataid:btn-launch-documentation>`,
        actionType: 'click',
        value: null,
        delayBefore: 1500,
        delayAfter: 1500
    },
    {
        path: `@[/]:<dataid:btn-launch-video>`,
        actionType: 'click',
        value: null,
        delayBefore: 2000,
        delayAfter: 2000
    },
    {
        path: `@[/]:<dataid:btn-launch-vehicle-models>`,
        actionType: 'click',
        value: null,
        delayBefore: 1000,
        delayAfter: 1000
    }
];

// Example usage:
// await executeActionSequence(sampleActionSequence);


await executeAction(action)

*/

function parseActionPath(actionPath: string): ActionPath {
    // Updated regex to support empty route (e.g., @[]:<dataid:btn>)
    const pathMatch = actionPath.match(/@\[(.*?)\]:<([^:>]+):([^>]+)>/);
    if (!pathMatch) {
        console.error(`Invalid action path format: ${actionPath}`);
        throw new Error('Invalid action path format');
    }
    const [, targetRoute, identifierType, identifierValue] = pathMatch;
    return { targetRoute, identifierType, identifierValue };
}

async function navigateToRoute(targetRoute: string): Promise<void> {
    const currentPath = window.location.pathname;
    if (currentPath !== targetRoute) {
        // Show toast before navigating
        console.log(`Navigating from ${currentPath} to ${targetRoute}`);
        
        // Check if it's an internal link (same domain) or external link
        const isInternalLink = targetRoute.startsWith('/') || 
            targetRoute.startsWith(window.location.origin) ||
            (!targetRoute.includes('://'));
        
        console.log(`Link type: ${isInternalLink ? 'internal' : 'external'}`);
        
        if (isInternalLink) {
            // Use React navigation for internal links
            const navigate = (window as any).reactNavigate;
            if (navigate) {
                console.log('Using React navigate for internal navigation');
                showToast(`Navigating to ${targetRoute} after 3 seconds`);
                setTimeout(() => {
                    navigate(targetRoute);
                }, 3000);
            } else {
                console.log('React navigate not available, using window.location fallback');
                // Fallback to window.location if navigate is not available
                // window.location.href = targetRoute;
            }
        } else {
            console.log('Using window.location for external navigation');
            // Use window.location for external links
            // window.location.href = targetRoute;
        }
        console.log('Waiting for navigation to complete...');
        await waitForNavigation(targetRoute);
        console.log('Navigation completed successfully');
    } else {
        console.log(`Already on ${targetRoute}`);
    }
}

async function waitForNavigation(targetRoute: string, timeout: number = 6000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const startTime = Date.now();
        
        const checkNavigation = (): void => {
            if (window.location.pathname === targetRoute) {
                resolve();
            } else if (Date.now() - startTime >= timeout) {
                reject(new Error(`Navigation timeout: Failed to navigate to ${targetRoute} within ${timeout}ms`));
            } else {
                setTimeout(checkNavigation, 100);
            }
        };
        checkNavigation();
    });
}

async function waitForPageLoad(): Promise<void> {
    // In React applications, the 'load' event may not fire for SPA navigation
    // Use a more robust approach that works with React Router
    await new Promise<void>(resolve => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            // Check both load event and readyState changes
            const handleLoad = () => resolve();
            const handleStateChange = () => {
                if (document.readyState === 'complete') {
                    resolve();
                }
            };
            
            window.addEventListener('load', handleLoad, { once: true });
            document.addEventListener('readystatechange', handleStateChange);
            
            // Cleanup after resolution
            setTimeout(() => {
                window.removeEventListener('load', handleLoad);
                document.removeEventListener('readystatechange', handleStateChange);
                resolve(); // Fallback resolution
            }, 3000);
        }
    });
    
    // Additional wait for dynamic content to load
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
}

function findElement(identifierType: string, identifierValue: string): Element {
    let targetElement: Element | null = null;
    
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

function findElementByCSS(identifierValue: string): Element | null {
    const indexMatch = identifierValue.match(/^(.+)\[(\d+)\]$/);
    if (indexMatch) {
        const [, selector, index] = indexMatch;
        const elements = document.querySelectorAll(selector);
        return elements[parseInt(index)] || null;
    } else {
        return document.querySelector(identifierValue);
    }
}

function addTooltipToElement(element: Element, message: string, autoHideAfter: number = 0): { tooltip: TippyInstance, originalClasses: string } {
    // Remove previous tippy instance if exists
    if ((element as any)._automationExtraInfo && (element as any)._automationExtraInfo.tooltip) {
        const prevTippy: TippyInstance = (element as any)._automationExtraInfo.tooltip;
        prevTippy.destroy();
        delete (element as any)._automationExtraInfo.tooltip;
    }

    const originalClasses = element.className;

    // Create tippy tooltip
    const tippyInstance = tippy(element, {
        content: message,
        allowHTML: true,
        showOnCreate: true,
        trigger: 'manual',
        placement: 'top',
        theme: 'gradient-tooltip', // custom theme
        interactive: true,
        appendTo: document.body,
        animation: 'perspective',
        maxWidth: 320,
        onHidden(instance) {
            instance.destroy();
            element.className = originalClasses;
            if ((element as any)._automationExtraInfo) {
                delete (element as any)._automationExtraInfo;
            }
        }
    });

    (element as any)._automationExtraInfo = {
        tooltip: tippyInstance,
        originalClasses: originalClasses,
        createdAt: Date.now()
    };

    // Auto-hide after specified time
    if (autoHideAfter > 0) {
        setTimeout(() => {
            tippyInstance.hide();
        }, autoHideAfter);
    }

    return { tooltip: tippyInstance, originalClasses };
}

// Helper function to restore element to its default state
function restoreElementDefault(element: Element) {
    if ((element as any)._automationExtraInfo) {
        const { tooltip, originalClasses } = (element as any)._automationExtraInfo;
        if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
        element.className = originalClasses;
    }
}

async function performElementAction(element: Element, action: Action): Promise<void> {
    const { actionType, value, delayBefore, delayAfter, tooltipMessage, autoHideAfter } = action;
    console.log(`Performing action: ${actionType} on element: ${element}`);
    switch (actionType) {
        case 'click':
            // console.log(`Executing click action on element:`, element);
            try {
                (element as HTMLElement).scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center', 
                    inline: 'center' 
                });
                await new Promise(resolve => setTimeout(resolve, 500));
                addTooltipToElement(element, tooltipMessage || 'Auto click this element', autoHideAfter);
                await new Promise(resolve => setTimeout(resolve, 3000));
                restoreElementDefault(element);
                (element as HTMLElement).click();
                
                console.log(`Click action completed`);
            } catch (error) {
                console.error('Click action failed:', error);
                throw error;
            }
            break;
        case 'show_tooltip':
            // console.log(`Executing show tooltip action on element:`, element);
            (element as HTMLElement).scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center', 
                inline: 'center' 
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            addTooltipToElement(element, tooltipMessage || 'Auto show tooltip', autoHideAfter);
            console.log(`Show tooltip action completed`);
            break;
        case 'hide_tooltip':
            console.log(`Executing hide tooltip action on element:`, element);
            restoreElementDefault(element);
            console.log(`Hide tooltip action completed`);
            break;
        case 'input':
            console.log(`Executing input action on element:`, element, `with value:`, value);
            if (value !== undefined) {
                (element as HTMLInputElement).value = value || '';
                element.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(`Input action completed with value: ${value || ''}`);
            } else {
                console.log(`Input action skipped - no value provided`);
            }
            break;
        default:
            console.error(`Unsupported action type: ${actionType}`);
            throw new Error(`Unsupported action type: ${actionType}`);
    }
}

function showToast(message: string, timeout: number = 3000): void {
    const reactToast = (window as any).reactToast;
    if (typeof reactToast === 'function') {
        reactToast({
            title: message,
            description: '',
            duration: timeout,
            className: 'bg-green-500 text-white',
        });
    } else {
        // Fallback: use alert if reactToast is not available
        alert(message);
    }
}


async function executeAction(action: Action): Promise<void> {
    const { targetRoute, identifierType, identifierValue } = parseActionPath(action.path);
    
    if (targetRoute && targetRoute !== '.' && window.location.pathname !== targetRoute) {
        await navigateToRoute(targetRoute);
        await waitForPageLoad();
    }
    
    const targetElement = findElement(identifierType, identifierValue);
    // console.log(`Found element: ${targetElement}`);
    // console.log(targetElement);

    performElementAction(targetElement, action);
}

// Function to execute a series of actions
async function executeActionSequence(actions: Action[]): Promise<void> {
    for (const action of actions) {
        try {
            // Apply delay before if specified
            if (action.delayBefore) {
                await new Promise<void>(resolve => setTimeout(resolve, action.delayBefore));
            }
            
            console.log(`Executing action: ${action.actionType} on ${action.path}`);
            await executeAction(action);
            
            // Apply delay after if specified
            if (action.delayAfter) {
                await new Promise<void>(resolve => setTimeout(resolve, action.delayAfter));
            }
            
            console.log(`Successfully executed action: ${action.actionType}`);
        } catch (error) {
            console.error(`Failed to execute action: ${action.actionType} on ${action.path}`, error);
            throw error; // Re-throw to stop sequence on error
        }
    }
}

// Export types separately
export type { Action, ActionPath };

// Export functions
export {
    parseActionPath,
    navigateToRoute,
    waitForNavigation,
    waitForPageLoad,
    findElement,
    findElementByCSS,
    performElementAction,
    executeAction,
    executeActionSequence
};
