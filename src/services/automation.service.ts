// Types for the automation service
interface ActionPath {
  targetRoute: string;
  identifierType: string;
  identifierValue: string;
}

interface Action {
  path: string;
  actionType: 'click' | 'input' | 'show_tooltip' | 'hide_tooltip';
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
    const pathMatch = actionPath.match(/@\[([^\]]+)\]:<([^:]+):([^>]+)>/);
    if (!pathMatch) {
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

function addTooltipToElement(element: Element, message: string, autoHideAfter: number = 0): { tooltip: HTMLDivElement, originalClasses: string } {

    // Try to remove previous tooltip if available
    if ((element as any)._automationExtraInfo && (element as any)._automationExtraInfo.tooltip) {
        const prevTooltip = (element as any)._automationExtraInfo.tooltip;
        if (prevTooltip.parentNode) {
            prevTooltip.parentNode.removeChild(prevTooltip);
        }
        delete (element as any)._automationExtraInfo.tooltip;
    }

    const originalClasses = element.className;
    // element.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-75', 'animate-pulse');
    
    // Create and show tooltip
    const tooltip = document.createElement('div');
    tooltip.className = `absolute z-50 pl-2 pr-8 py-1 text-sm font-medium text-white bg-amber-500 rounded-lg shadow-sm opacity-100 tooltip`;
    tooltip.textContent = message;
    tooltip.style.position = 'absolute';

    // Create close button for tooltip
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close tooltip');
    closeButton.className = 'absolute top-0 right-2 bg-transparent border-none text-white text-xl hover:opacity-80 cursor-pointer z-[10000]';

    // Add click event to close tooltip and restore element
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
        element.className = originalClasses;
        // Remove extra info to avoid memory leaks
        if ((element as any)._automationExtraInfo) {
            delete (element as any)._automationExtraInfo;
        }
    });

    tooltip.appendChild(closeButton);
    
    // Position tooltip above the element
    const rect = element.getBoundingClientRect();
    // Position tooltip above the element, but ensure it stays within the viewport horizontally
    const tooltipWidth = 320; // Estimate or set a max width for tooltip
    tooltip.style.maxWidth = tooltipWidth + 'px';
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 10}px`;
    tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
    tooltip.style.zIndex = '9999';
    // Add shadow for tooltip
    tooltip.style.boxShadow = '0 4px 16px 0 rgba(0,0,0,0.18), 0 1.5px 4px 0 rgba(0,0,0,0.12)';

    // After appending, adjust if tooltip is out of viewport
    document.body.appendChild(tooltip);
    const tipRect = tooltip.getBoundingClientRect();

    // Horizontal adjustment
    let shiftX = 0;
    if (tipRect.left < 0) {
        shiftX = -tipRect.left + 8;
    } else if (tipRect.right > window.innerWidth) {
        shiftX = window.innerWidth - tipRect.right - 8;
    }
    if (shiftX !== 0) {
        tooltip.style.left = `${rect.left + rect.width / 2 + shiftX}px`;
    }

    // Vertical adjustment: if tooltip is above the viewport, move it below the element
    if (tipRect.top < 0) {
        tooltip.style.top = `${rect.bottom + 10}px`;
        tooltip.style.transform = 'translateX(-50%)'; // Remove Y translation
        // Move arrow to top
        const arrow = tooltip.querySelector('.tooltip-arrow') as HTMLDivElement;
        if (arrow) {
            arrow.style.top = '-10px';
            arrow.style.borderColor = 'transparent transparent #F59E0B transparent';
        }
    }
    
    // Add arrow to tooltip
    const arrow = document.createElement('div');
    arrow.className = 'tooltip-arrow';
    arrow.style.position = 'absolute';
    arrow.style.top = '100%';
    arrow.style.left = '50%';
    arrow.style.marginLeft = '-8px'; // double the margin to match new width
    arrow.style.borderWidth = '8px';
    arrow.style.borderStyle = 'solid';
    arrow.style.borderColor = '#F59E0B transparent transparent transparent';
    tooltip.appendChild(arrow);

    document.body.appendChild(tooltip);

    (element as any)._automationExtraInfo = {
        tooltip: tooltip,
        originalClasses: originalClasses,
        createdAt: Date.now()
    };

    if (autoHideAfter > 0) {
        setTimeout(() => {
            restoreElementDefault(element);
        }, autoHideAfter);
    }

    return { tooltip, originalClasses };
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
            console.log(`Executing click action on element:`, element);
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
            console.log(`Executing show tooltip action on element:`, element);
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
    
    await navigateToRoute(targetRoute);
    await waitForPageLoad();
    
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
