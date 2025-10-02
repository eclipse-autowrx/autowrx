// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react';
import {
	SemanthaFrontendAuth,
	testPrompt,
	testSimilarity,
	config,
} from '@/lib/external_reqs';

const auth = new SemanthaFrontendAuth(
	config.tokenUrl,
	config.clientId,
	config.clientSecret,
);

const TestM89: React.FC = () => {
	const [promptResult, setPromptResult] = useState<any>(null);
	const [error, setError] = useState<string>('');
	const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' or 'file'
	const [token, setToken] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<string>('');

	const handleTestPrompt = async () => {
		setError('');
		setPromptResult(null);
		try {
			const PROMPT_ID = 'ca4d0f29-aceb-4d0c-93a6-33fae49b5731';
			const PROMPT_INPUT_TEXT = `Requirement: The vehicle's airbag control unit (ACU) must meet ASIL-D.`;
			const PROMPT_REFERENCE_TEXT = `Requirement: The vehicle's airbag control unit (ACU) must meet ASIL-D and be awesome.`;
			const result = await testPrompt(
				auth,
				PROMPT_ID,
				PROMPT_INPUT_TEXT,
				PROMPT_REFERENCE_TEXT,
			);
			setPromptResult(result);
		} catch (err: any) {
			setError(err.message);
		}
	};

	const handleGetToken = async () => {
		setError('');
		setToken(null);
		try {
			const fetchedToken = await auth.ensureAuthenticated();
			setToken(fetchedToken);
		} catch (err: any) {
			setError(err.message);
		}
	};

	const handleTestConnection = async () => {
		setError('');
		setConnectionStatus('Testing...');
		try {
			// Use testSimilarity as a simple API call to check the connection
			await testSimilarity(auth, 'test connection', 1);
			setConnectionStatus('Connection successful!');
		} catch (err: any) {
			setConnectionStatus(`Connection failed: ${err.message}`);
			setError(err.message);
		}
	};

	const tabStyle = (tabName: string) => ({
		padding: '10px',
		cursor: 'pointer',
		borderBottom:
			activeTab === tabName
				? '2px solid blue'
				: '2px solid transparent',
		color: activeTab === tabName ? 'blue' : 'black',
	});

	return (
		<div style={{ padding: '20px' }}>
			<h1>Test Page for external_reqs.js</h1>

			<div
				style={{
					display: 'flex',
					borderBottom: '1px solid #ccc',
					marginBottom: '20px',
				}}
			>
				<div
					style={tabStyle('prompt')}
					onClick={() => setActiveTab('prompt')}
				>
					Test Prompt
				</div>
				<div
					style={tabStyle('file')}
					onClick={() => setActiveTab('file')}
				>
					Access Token Test
				</div>
			</div>

			{error && <p style={{ color: 'red' }}>{error}</p>}

			{activeTab === 'prompt' && (
				<div>
					<h2>Test Prompt</h2>
					<button onClick={handleTestPrompt}>Run Prompt Test</button>
					{promptResult && (
						<pre>{JSON.stringify(promptResult, null, 2)}</pre>
					)}
				</div>
			)}

			{activeTab === 'file' && (
				<div>
					<h2>Access Token</h2>
					<button onClick={handleGetToken}>Get/Refresh Token</button>
					{token && (
						<p style={{ wordBreak: 'break-all' }}>Token: {token}</p>
					)}

					<h2 style={{ marginTop: '20px' }}>Test API Connection</h2>
					<button onClick={handleTestConnection}>
						Test Connection
					</button>
					{connectionStatus && <p>{connectionStatus}</p>}
				</div>
			)}
		</div>
	);
};

export default TestM89;
