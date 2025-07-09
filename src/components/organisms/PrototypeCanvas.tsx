import React from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Dummy data for nodes and edges
const initialNodes = [
    {
        id: '1',
        position: { x: 100, y: 100 },
        data: { label: 'Node 1' },
        type: 'default',
    },
    {
        id: '2',
        position: { x: 300, y: 100 },
        data: { label: 'Node 2' },
        type: 'default',
    },
];

const initialEdges = [
	{
		id: 'e1-2',
		source: '1',
		target: '2',
		type: 'default',
	},
];

const PrototypeCanvas: React.FC = () => {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	return (
		<div className='w-full h-full min-h-[90vh] bg-gray-100'>
			<ReactFlow 
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				fitView
			>
				<Background />
				<Controls />
			</ReactFlow>
		</div>
	);
};

export default PrototypeCanvas;