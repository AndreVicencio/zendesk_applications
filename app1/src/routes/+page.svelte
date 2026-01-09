<script lang="ts">
	import { onMount } from 'svelte';

	// Svelte 5 state for the ticket ID
	let ticketId = $state<number | null>(null);
	let agentName = $state('Agent');

	onMount(() => {
		// Initialize the ZAF Client
		// @ts-ignore
		const client = ZAFClient.init();

		// 1. Get the Ticket ID
		client.get('ticket.id').then((data: { 'ticket.id': number }) => {
			ticketId = data['ticket.id'];
		});

		// 2. Get the Agent Name (just for fun)
		client.get('currentUser.name').then((data: { 'currentUser.name': string }) => {
			agentName = data['currentUser.name'];
		});
	});
</script>

<svelte:head>
	<script src="https://static.zdassets.com/zendesk_app_framework_sdk/2.0/zaf_sdk.min.js"></script>
</svelte:head>

<main style="padding: 20px; font-family: system-ui, sans-serif; color: #2f3941;">
	<header style="border-bottom: 1px solid #ddd; margin-bottom: 15px; padding-bottom: 10px;">
		<h3 style="margin: 0;">Private Notes</h3>
		<small>Logged in as: {agentName}</small>
	</header>

	{#if ticketId}
		<div style="background: #eaf3f8; border-left: 4px solid #1f73b7; padding: 10px;">
			<p style="margin: 0; font-weight: 500;">
				You are in ticket <strong>#{ticketId}</strong>
			</p>
		</div>
	{:else}
		<p>Loading ticket context...</p>
	{/if}
</main>
