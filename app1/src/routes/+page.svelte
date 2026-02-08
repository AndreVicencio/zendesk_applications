<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import Image from '@tiptap/extension-image';

    let ticketId = $state<string | null>(null);
    let editorElement = $state<HTMLElement>();
    let editor = $state<Editor>();
    let saveStatus = $state('Idle');

    onMount(async () => {
        const client = (window as any).ZAFClient.init();
        
        // 1. Force the app to take up the full vertical space
        client.invoke('resize', { height: '85vh', width: '100%' });

        const context = await client.get('ticket.id');
        ticketId = context['ticket.id'].toString();

        const response = await fetch(`http://localhost:3000/api/notes/${ticketId}`);
        const data = await response.json();

        editor = new Editor({
            element: editorElement!,
            extensions: [StarterKit, Image],
            content: data.content || '<p></p>', // Start empty for a cleaner look
            onUpdate: ({ editor }) => {
                debouncedSave(editor.getJSON());
            }
        });
    });

    let timer: any;
    async function debouncedSave(content: any) {
        saveStatus = '...'; // Keep status minimal
        clearTimeout(timer);

        timer = setTimeout(async () => {
            try {
                await fetch(`http://localhost:3000/api/notes/${ticketId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                });
                saveStatus = `Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } catch (e) {
                saveStatus = 'Error!';
            }
        }, 1000);
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
    /* Reset and occupy full viewport */
    :global(body) { margin: 0; padding: 0; overflow: hidden; height: 100vh; }
    
    .app-wrapper { 
        display: flex; 
        flex-direction: column; 
        height: 100vh; 
        background: #fff; 
        border-top: 1px solid #d8dcde; /* Subtle line to separate from ZD header */
    }
    
    .toolbar { 
        padding: 4px 10px; 
        background: #fff; 
        display: flex; 
        justify-content: flex-end;
    }

    .status-pill { 
        font-size: 9px; 
        text-transform: uppercase; 
        letter-spacing: 0.5px;
        color: #999; 
        font-family: sans-serif; 
    }

    .editor-area { 
        flex: 1; 
        overflow-y: auto; 
        padding: 0 15px 20px 15px; /* Side padding only */
    }

    /* Tiptap Notion-Style Compression */
    :global(.ProseMirror) { 
        outline: none; 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        line-height: 1.4; /* Tighter line height */
        font-size: 13px; /* Slightly smaller for density */
        color: #2f3941;
    }

    /* Remove the "double space" effect by nuking paragraph margins */
    :global(.ProseMirror p) {
        margin: 0 0 4px 0; /* Only 4px gap between lines */
    }

    /* Standard block elements */
    :global(.ProseMirror ul, .ProseMirror ol) {
        padding-left: 1.2rem;
       margin: 4px 0;
    }

    :global(.ProseMirror img) { 
        max-width: 100%; 
        border-radius: 2px; 
        margin: 8px 0; 
    }

    /* Minimal placeholder styling */
    :global(.ProseMirror p.is-editor-empty:first-child::before) {
        content: "Type private note...";
        color: #cfd4d8;
        float: left;
        height: 0;
        pointer-events: none;
    }
</style>
