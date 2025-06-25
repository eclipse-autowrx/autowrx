window.postMessage(
  {
    type: 'automation_control',
    cmd: 'run_sequence',
    sequence: {
      name: 'Sequence to create new vehicle model',
      description:
        'This sequence guides the user through creating a new vehicle model',
      actions: [
        {
          name: 'Open Model Gallery',
          path: `@[/]:<dataid:btn-launch-vehicle-models>`,
          actionType: 'show_tooltip',
          value: null,
          tooltipMessage: 'Click here to launch the Model Gallery',
          delayBefore: 1000,
          delayAfter: 1000,
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
          tooltipMessage: 'Click me to open Create dialog',
          delayBefore: 3000,
          delayAfter: 1000,
          finish_condition: {
            type: 'element_visible',
            target_element_path: '@[]:<dataid:form-create-model>',
            expectedValue: '',
          },
        },
      ],
    },
  },
  '*',
)
