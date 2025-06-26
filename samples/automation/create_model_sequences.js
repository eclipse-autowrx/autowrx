window.postMessage(
    {
        type: 'automation_control',
        cmd: 'run_sequence',
        sequence: {
            name: 'Sequence to create new vehicle model',
            description:
                'This sequence guides the user through the process of creating a new vehicle model',
            auto_run_next: false,
            trigger_source: 'console',
            actions: [
                {
                    name: 'Open Model Gallery',
                    path: `@[/]:<dataid:btn-launch-vehicle-models>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click here to launch the Model Gallery',
                    delayBefore: 500,
                    delayAfter: 500,
                    finish_condition: {
                        type: 'location-match',
                        expectedValue: '/model',
                    },
                },
                {
                    name: 'Click on Create New Model',
                    path: `@[]:<dataid:btn-open-form-create>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click here to open the Create dialog',
                    delayBefore: 500,
                    delayAfter: 500,
                    finish_condition: {
                        type: 'element_visible',
                        target_element_path: '@[]:<dataid:form-create-model>',
                        expectedValue: '',
                    },
                },
                {
                    name: 'Enter model name',
                    path: `@[]:<dataid:form-create-model-input-name>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Enter the name of the new vehicle model',
                    delayBefore: 500,
                    delayAfter: 500,
                    finish_condition: {
                        type: 'has-value',
                        target_element_path: '@[]:<dataid:form-create-model-input-name>',
                        expectedValue: '',
                    },
                },
                {
                    name: 'Select Vehicle API version',
                    path: `@[]:<dataid:form-create-model-select-api>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Select the Vehicle API version if needed',
                    delayBefore: 500,
                    delayAfter: 2000
                },
                {
                    name: 'Submit the form',
                    path: `@[]:<dataid:form-create-model-btn-submit>`,
                    actionType: 'show_tooltip',
                    value: null,
                    tooltipMessage: 'Click here to submit',
                    delayBefore: 500,
                    delayAfter: 200,
                    finish_condition: {
                        type: 'element_clicked',
                        target_element_path: '@[]:<dataid:form-create-model-btn-submit>',
                        expectedValue: '',
                    },
                },
            ],
        },
    },
    '*',
)
