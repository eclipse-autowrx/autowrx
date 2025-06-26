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
                {
                    name: 'Open Your Model',
                    path: `@[/model]:<css:.my_model_grid_item>[0]`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click to open model',
                    delayBefore: 500,
                    delayAfter: 500,
                    finish_condition: {
                        type: 'location-match',
                        expectedValue: '/model/:model_id',
                    },
                    error_messeges: {
                        "path_not_found": "You have no models yet. Please create a model first."
                    }
                },
                {
                    name: 'Open Prototype Library',
                    path: `@[]:<dataid:tab-model-library>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click here to open Prototype Library',
                    delayBefore: 500,
                    delayAfter: 500,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: '',
                        target_element_path: '@[]:<dataid:tab-model-library>',
                    },
                    error_messeges: {
                        "path_not_found": "Something went wrong."
                    }
                },
                {
                    name: 'Click Create New Prototype',
                    path: '@[]:<dataid:btn-create-new-prototype>',
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click here to Create a new prototype',
                    delayBefore: 500,
                    delayAfter: 500,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: '',
                        target_element_path: '@[]:<dataid:btn-create-new-prototype>',
                    },
                    error_messeges: {
                        "path_not_found": "Create New Prototype button not found."
                    }
                },
                {
                    name: 'Enter Prototype Name',
                    path: '@[]:<dataid:prototype-name-input>',
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Enter a name for your new prototype',
                    delayBefore: 500,
                    delayAfter: 500,
                    finish_condition: {
                        type: 'has-value',
                        expectedValue: '',
                        target_element_path: '@[]:<dataid:prototype-name-input>',
                    },
                    error_messeges: {
                        "path_not_found": "Prototype name input not found."
                    }
                },
                {
                    name: 'Select Prototype Language',
                    path: '@[]:<dataid:prototype-language-select>',
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Select a language for your prototype, prefer python for beginners',
                    delayBefore: 500,
                    delayAfter: 500,
                    error_messeges: {
                        "path_not_found": "Prototype language select not found."
                    }
                },
                {
                    name: 'Confirm Create Prototype',
                    path: '@[]:<dataid:btn-create-prototype>',
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click here to confirm and create your prototype',
                    delayBefore: 500,
                    delayAfter: 500,
                    finish_condition: {
                        type: 'element_clicked',
                        expectedValue: '',
                        target_element_path: '@[]:<dataid:btn-create-prototype>',
                    },
                    error_messeges: {
                        "path_not_found": "Create Prototype button not found."
                    }
                }
            ],
        },
    },
    '*',
)


