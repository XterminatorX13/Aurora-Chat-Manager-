<script lang="ts">
    import Button from "$lib/components/ui/Button.svelte";
    import Badge from "$lib/components/ui/Badge.svelte";
    import Separator from "$lib/components/ui/Separator.svelte";
    import Input from "$lib/components/ui/Input.svelte";
</script>

<div class="min-h-screen bg-bg-main p-12 text-color-text-primary">
    <div class="max-w-5xl mx-auto space-y-12">
        <header class="pb-8 border-b border-border">
            <h1 class="text-4xl font-bold mb-2">Umbra Design System (UDS)</h1>
            <p class="text-color-text-secondary">Catálogo de componentes e tokens do sistema.</p>
        </header>

        <!-- 1. Tokens: Cores Semânticas -->
        <section class="space-y-6">
            <h2 class="text-2xl font-semibold">1. Design Tokens</h2>
            
            <div class="space-y-4">
                <h3 class="text-lg text-color-text-tertiary">Cores Semânticas</h3>
                <div class="grid grid-cols-4 gap-4">
                    <div class="p-4 rounded-lg flex flex-col items-center justify-center gap-2" style="background-color: var(--color-success)">
                        <span class="font-bold text-white">Success</span>
                    </div>
                    <div class="p-4 rounded-lg flex flex-col items-center justify-center gap-2" style="background-color: var(--color-warning)">
                        <span class="font-bold text-white">Warning</span>
                    </div>
                    <div class="p-4 rounded-lg flex flex-col items-center justify-center gap-2" style="background-color: var(--color-error)">
                        <span class="font-bold text-white">Error</span>
                    </div>
                    <div class="p-4 rounded-lg flex flex-col items-center justify-center gap-2" style="background-color: var(--color-info)">
                        <span class="font-bold text-white">Info</span>
                    </div>
                </div>
            </div>
            
            <div class="space-y-4">
                <h3 class="text-lg text-color-text-tertiary">Paleta Base (Aurora)</h3>
                <div class="grid grid-cols-3 gap-4">
                    <div class="p-4 rounded-lg text-center" style="background-color: var(--bg-deep)">bg-deep</div>
                    <div class="p-4 rounded-lg text-center" style="background-color: var(--bg-main)">bg-main</div>
                    <div class="p-4 rounded-lg text-center" style="background-color: var(--bg-panel)">bg-panel</div>
                    <div class="p-4 rounded-lg text-center" style="background-color: var(--layer-1)">layer-1</div>
                    <div class="p-4 rounded-lg text-center" style="background-color: var(--layer-2)">layer-2</div>
                    <div class="p-4 rounded-lg text-center" style="background-color: var(--layer-3)">layer-3</div>
                </div>
            </div>
        </section>

        <Separator />

        <!-- 2. UI: Botões -->
        <section class="space-y-6">
            <h2 class="text-2xl font-semibold">2. Componentes (Nível 1 - UI)</h2>
            
            <div class="space-y-4">
                <h3 class="text-lg text-color-text-tertiary">Button</h3>
                <div class="flex items-center gap-4 flex-wrap">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button disabled>Disabled</Button>
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="text-lg text-color-text-tertiary">Input</h3>
                <div class="max-w-md space-y-4">
                    <Input placeholder="Input normal..." />
                    <Input placeholder="Desativado..." disabled />
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="text-lg text-color-text-tertiary">Badge</h3>
                <div class="flex items-center gap-4">
                    <Badge variant="primary">Novo</Badge>
                    <Badge variant="secondary">Status</Badge>
                    <Badge variant="outline">Label</Badge>
                </div>
            </div>
        </section>

        <!-- Outros componentes podem ser adicionados progressivamente -->
    </div>
</div>
