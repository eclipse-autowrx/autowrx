window.postMessage(
    {
        type: 'automation_control',
        cmd: 'run_sequence',
        sequence: {
            name: 'Sequence to create new prototype',
            description:
                'This sequence guides the user through the process of creating a new prototype',
            auto_run_next: true,
            trigger_source: 'console',
            actions: [
                // {
                //     name: 'Open Your Model',
                //     path: `@[/model]:<css:.my_model_grid_item[0]>`,
                //     actionType: 'show_tooltip',
                //     value: null,
                //     tooltipMessage: 'Click on a model to open it',
                //     delayBefore: 500,
                //     delayAfter: 500,
                //     finish_condition: {
                //         type: 'location-match',
                //         expectedValue: '/model/:model_id',
                //     },
                //     error_messeges: {
                //         "element_not_found": "You have no models yet. Please create a model first."
                //     }
                // },
                // {
                //     name: 'Open Prototype Library',
                //     path: `@[]:<dataid:tab-model-library>`,
                //     actionType: 'show_tooltip',
                //     value: null,
                //     tooltipMessage: 'Click here to open Prototype Library',
                //     delayBefore: 500,
                //     delayAfter: 500,
                //     finish_condition: {
                //         type: 'element_clicked',
                //         expectedValue: '',
                //         target_element_path: '@[]:<dataid:tab-model-library>',
                //     },
                //     error_messeges: {
                //         "element_not_found": "Something went wrong."
                //     }
                // },
                // {
                //     name: 'Open Your Prototype',
                //     path: `@[]:<css:.prototype-grid-item-wrapper[0]>`,
                //     actionType: 'show_tooltip',
                //     value: null,
                //     tooltipMessage: 'Click on a prototype to open it',
                //     delayBefore: 500,
                //     delayAfter: 500,
                //     finish_condition: {
                //         type: 'location-match',
                //         expectedValue: '/model/:model_id/library/prototype/:prototype_id/view',
                //     },
                //     error_messeges: {
                //         "element_not_found": "You have no prototype yet. Please create a prototype first."
                //     }
                // },
                // {
                //     name: 'Click Dashboard Tab',
                //     path: `@[]:<dataid:tab-dashboard>`,
                //     actionType: 'show_tooltip',
                //     value: null,
                //     tooltipMessage: 'Click here to open Dashboard',
                //     delayBefore: 500,
                //     delayAfter: 500,
                //     finish_condition: {
                //         type: 'element_clicked',
                //         expectedValue: null,
                //         target_element_path: '@[]:<dataid:tab-dashboard>',
                //     },
                //     error_messeges: {
                //         "element_not_found": "Tab dashboard not found."
                //     }
                // },
                {
                    name: 'Enter Dashboard Edit Mode',
                    path: `@[]:<dataid:dashboard-edit-button>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click to enter Dashboard Edit Mode',
                    delayBefore: 500,
                    delayAfter: 500,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: null,
                        target_element_path: '@[]:<dataid:dashboard-edit-button>',
                    },
                    error_messeges: {
                        "element_not_found": "Some thing went wrong. Dashboard Edit button not found."
                    }
                },
                {
                    name: 'Pick cells to place widget',
                    path: `@[]:<css:.widget-grid-cell-empty[0]>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Pick cells to place widget',
                    delayBefore: 200,
                    delayAfter: 200,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: null,
                        target_element_path: '@[]:<css:.widget-grid-cell-empty[0]>',
                    },
                    error_messeges: {
                        "element_not_found": "Some thing went wrong. Widget cell not found"
                    }
                },
                {
                    name: 'Pick cells to place widget',
                    path: `@[]:<css:.widget-grid-cell-empty[0]>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Pick cells to place widget',
                    delayBefore: 200,
                    delayAfter: 200,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: null,
                        target_element_path: '@[]:<css:.widget-grid-cell-empty[0]>',
                    },
                    error_messeges: {
                        "element_not_found": "Some thing went wrong. Widget cell not found"
                    }
                },
                {
                    name: 'Pick cells to place widget',
                    path: `@[]:<css:.widget-grid-cell-empty[0]>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Pick cells to place widget',
                    delayBefore: 200,
                    delayAfter: 200,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: null,
                        target_element_path: '@[]:<css:.widget-grid-cell-empty[0]>',
                    },
                    error_messeges: {
                        "element_not_found": "Some thing went wrong. Widget cell not found"
                    }
                },
                // {
                //     name: 'Pick cells to place widget',
                //     path: ``,
                //     actionType: 'wait_for_condition',
                //     value: null,
                //     tooltipMessage: 'Pick cells to place widget',
                //     delayBefore: 200,
                //     delayAfter: 200,
                //     finish_condition: {
                //         type: 'element_visible',
                //         expectedValue: null,
                //         target_element_path: '@[]:<css:.col-span-2>',
                //     },
                //     error_messeges: {
                //         "element_not_found": "Some thing went wrong. Widget cell not found"
                //     }
                // },
                {
                    name: 'Click Add Widget Button',
                    path: `@[]:<dataid:dashboard-add-widget-button>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click add widget button',
                    delayBefore: 200,
                    delayAfter: 200,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: null,
                        target_element_path: '@[]:<dataid:dashboard-add-widget-button>',
                    },
                    error_messeges: {
                        "element_not_found": "Some thing went wrong. Element not found"
                    }
                },
                {
                    name: 'Search for Widget',
                    path: `@[]:<dataid:widget-search-input>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Enter: 3d car unity',
                    delayBefore: 200,
                    delayAfter: 200,
                    finish_condition: {
                        type: 'text_contains',
                        expectedValue: '3d car unity',
                        target_element_path: '@[]:<dataid:widget-search-input>',
                    },
                    error_messeges: {
                        "element_not_found": "Some thing went wrong. Element not found"
                    }
                },
                {
                    name: 'Select widget',
                    path: `@[]:<css:.widget-list-item[0]>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Select "3d car unity" widget',
                    delayBefore: 200,
                    delayAfter: 200,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: null,
                        target_element_path: '@[]:<css:.widget-list-item[0]>',
                    },
                    error_messeges: {
                        "element_not_found": "Some thing went wrong. Element not found"
                    }
                },
                {
                    name: 'Click add widget',
                    path: `@[]:<dataid:btn-add-widget-in-widget-library>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click here to add widget to dashboard',
                    delayBefore: 200,
                    delayAfter: 200,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: null,
                        target_element_path: '@[]:<dataid:btn-add-widget-in-widget-library>',
                    },
                    error_messeges: {
                        "element_not_found": "Some thing went wrong. Element not found"
                    }
                },
                {
                    name: 'Click Save',
                    path: `@[]:<dataid:dashboard-save-button>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click here to save',
                    delayBefore: 200,
                    delayAfter: 200,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: null,
                        target_element_path: '@[]:<dataid:dashboard-save-button>',
                    },
                    error_messeges: {
                        "element_not_found": "Some thing went wrong. Element not found"
                    }
                },
                
            ]
        }
    })