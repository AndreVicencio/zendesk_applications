<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import Image from '@tiptap/extension-image';

    // Svelte 5 Runes for state
    let ticketId = $state<string | null>(null);
    let editorElement = $state<HTMLElement>();
    let editor = $state<Editor>();
    let saveStatus = $state('Idle');

    onMount(async () => {
        // @ts-ignore - Initialize Zendesk
        const client = ZAFClient.init();
        const context = await client.get('ticket.id');
        ticketId = context['ticket.id'].toString();

        // 1. Fetch existing note from our Fastify server
        const response = await fetch(`http://localhost:3000/api/notes/${ticketId}`);
        const data = await response.json();

        // 2. Initialize Tiptap
        editor = new Editor({
            element: editorElement!,
            extensions: [StarterKit, Image],
            content: data.content || '<p>Start typing your private notes...</p>',
            onUpdate: ({ editor }) => {
                const json = editor.getJSON();
                debouncedSave(json);
            }
        });
    });

    // --- Debounced Auto-Save Logic ---
    let timer: any;
    async function debouncedSave(content: any) {
        saveStatus = 'Typing...';
        clearTimeout(timer);

        timer = setTimeout(async () => {
            saveStatus = 'Saving to local disk...';
            try {
                await fetch(`http://localhost:3000/api/notes/${ticketId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
                saveStatus = `Saved at ${new Date().toLocaleTimeString()}`;
            } catch (e) {
                saveStatus = 'Error saving!';
            }
        }, 1000); // 1-second delay
    }

    onDestroy(() => { if (editor) editor.destroy(); });
</script>

<svelte:head>
    <script src="https://static.zdassets.com/zendesk_app_framework_sdk/2.0/zaf_sdk.min.js"></script>
</svelte:head>

<div class="app-wrapper">
    <div class="toolbar">
        <span class="status-pill">{saveStatus}</span>
    </div>

    <div class="editor-area" bind:this={editorElement}></div>
</div>

<style>
    :global(body) { margin: 0; overflow: hidden; }
    .app-wrapper { display: flex; flex-direction: column; height: 100vh; background: #fff; }
    
    .toolbar { 
        padding: 5px 10px; 
        background: #f8f9f9; 
        border-bottom: 1px solid #ddd; 
        display: flex; 
        justify-content: flex-end;
    }

    .status-pill { font-size: 10px; color: #68737d; font-family: sans-serif; }

    .editor-area { flex: 1; overflow-y: auto; padding: 15px; }

    /* Tiptap Notion styling */
    :global(.ProseMirror) { 
        outline: none; 
        font-family: 'Inter', sans-serif; 
        line-height: 1.6; 
        font-size: 14px; 
    }
    :global(.ProseMirror img) { max-width: 100%; border-radius: 4px; margin: 10px 0; }
    :global(.ProseMirror p.is-editor-empty:first-child::before) {
        content: attr(data-placeholder);
        color: #adb5bd;
        float: left;
        height: 0;
        pointer-events: none;
    }
</style>
