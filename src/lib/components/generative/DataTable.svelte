<script>
  import { createEventDispatcher } from "svelte";

  /** @type {string} */
  export let title = "";
  /** @type {string[]} */
  export let headers = [];
  /** @type {string[][]} */
  export let rows = [];
  /** @type {string} */
  export let caption = "";

  const dispatch = createEventDispatcher();

  // ── Sort state ──
  let sortCol = -1;
  let sortAsc = true;

  // ── Filter state ──
  let filterText = "";

  $: filteredRows = filterText
    ? rows.filter((row) =>
        row.some((cell) =>
          cell.toLowerCase().includes(filterText.toLowerCase())
        )
      )
    : rows;

  $: sortedRows = sortCol >= 0
    ? [...filteredRows].sort((a, b) => {
        const valA = a[sortCol] || "";
        const valB = b[sortCol] || "";
        // Try numeric sort first
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortAsc ? numA - numB : numB - numA;
        }
        return sortAsc
          ? valA.localeCompare(valB, undefined, { sensitivity: "base" })
          : valB.localeCompare(valA, undefined, { sensitivity: "base" });
      })
    : filteredRows;

  function toggleSort(colIndex) {
    if (sortCol === colIndex) {
      sortAsc = !sortAsc;
    } else {
      sortCol = colIndex;
      sortAsc = true;
    }
  }

  function handleRowClick(row, rowIndex) {
    dispatch("action", { action: "row_click", row, rowIndex });
  }

  function exportCSV() {
    const csvContent = [
      headers.join(","),
      ...sortedRows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "data"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="data-table" role="region" aria-label={title || "Tabela de dados"}>
  {#if title}
    <div class="data-table__header">
      <h4 class="data-table__title">{title}</h4>
      <div class="data-table__toolbar">
        <input
          class="data-table__filter"
          type="text"
          placeholder="Filtrar..."
          bind:value={filterText}
          aria-label="Filtrar tabela"
        />
        <button
          class="data-table__export"
          on:click={exportCSV}
          title="Exportar CSV"
          aria-label="Exportar como CSV"
        >
          ↓ CSV
        </button>
      </div>
    </div>
  {:else}
    <div class="data-table__toolbar-only">
      <input
        class="data-table__filter"
        type="text"
        placeholder="Filtrar..."
        bind:value={filterText}
        aria-label="Filtrar tabela"
      />
      <button
        class="data-table__export"
        on:click={exportCSV}
        title="Exportar CSV"
        aria-label="Exportar como CSV"
      >
        ↓ CSV
      </button>
    </div>
  {/if}

  <div class="data-table__scroll">
    <table>
      <thead>
        <tr>
          {#each headers as header, i}
            <th>
              <button
                class="data-table__sort-btn"
                on:click={() => toggleSort(i)}
                aria-label="Ordenar por {header}"
              >
                {header}
                <span class="data-table__sort-icon" aria-hidden="true">
                  {#if sortCol === i}
                    {sortAsc ? "↑" : "↓"}
                  {:else}
                    ·
                  {/if}
                </span>
              </button>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sortedRows as row, rowIndex (rowIndex)}
          <tr
            class="data-table__row"
            on:click={() => handleRowClick(row, rowIndex)}
            tabindex="0"
            on:keydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleRowClick(row, rowIndex);
              }
            }}
          >
            {#each row as cell, cellIndex}
              <td class:is-numeric={!isNaN(parseFloat(cell))}>{cell}</td>
            {/each}
          </tr>
        {/each}
        {#if sortedRows.length === 0}
          <tr>
            <td colspan={headers.length} class="data-table__empty">
              {filterText ? "Nenhum resultado para o filtro" : "Sem dados"}
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  {#if caption || filteredRows.length !== rows.length}
    <div class="data-table__footer">
      {#if filteredRows.length !== rows.length}
        <span class="data-table__count">
          {filteredRows.length} de {rows.length} linhas
        </span>
      {/if}
      {#if caption}
        <span class="data-table__caption">{caption}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .data-table {
    background: var(--layer-1);
    border: 1px solid var(--border-light);
    border-radius: var(--radius);
    overflow: hidden;
    font-family: var(--font-primary);
    contain: content;
  }

  .data-table__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border);
    gap: var(--space-3);
  }

  .data-table__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  .data-table__toolbar,
  .data-table__toolbar-only {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .data-table__toolbar-only {
    padding: var(--space-2) var(--space-4);
    border-bottom: 1px solid var(--border);
  }

  .data-table__filter {
    font-size: 11px;
    font-family: var(--font-primary);
    color: var(--color-text-primary);
    background: var(--bg-deep);
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
    padding: var(--space-1) var(--space-3);
    outline: none;
    width: 140px;
    transition: border-color 0.15s ease;
  }

  .data-table__filter::placeholder {
    color: var(--color-text-tertiary);
  }

  .data-table__filter:focus {
    border-color: var(--border-focus);
  }

  .data-table__export {
    font-size: 10px;
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--highlight);
    background: rgba(157, 78, 221, 0.08);
    border: 1px solid rgba(157, 78, 221, 0.15);
    border-radius: var(--radius-small);
    padding: var(--space-1) var(--space-2);
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .data-table__export:hover {
    background: rgba(157, 78, 221, 0.15);
    border-color: rgba(157, 78, 221, 0.3);
  }

  .data-table__export:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  .data-table__scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  thead {
    background: var(--bg-deep);
  }

  th {
    text-align: left;
    padding: 0;
    border-bottom: 1px solid var(--border-light);
  }

  .data-table__sort-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    font-size: 10px;
    font-weight: 700;
    font-family: var(--font-primary);
    color: var(--color-text-tertiary);
    background: transparent;
    border: none;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    transition: color 0.15s ease;
    white-space: nowrap;
  }

  .data-table__sort-btn:hover {
    color: var(--color-text-primary);
  }

  .data-table__sort-btn:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: -2px;
  }

  .data-table__sort-icon {
    color: var(--highlight);
    font-size: 11px;
    opacity: 0.6;
  }

  td {
    padding: var(--space-2) var(--space-3);
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  td.is-numeric {
    font-family: var(--font-mono);
    font-size: 11px;
    text-align: right;
  }

  .data-table__row {
    cursor: pointer;
    transition: background 0.1s ease;
  }

  .data-table__row:hover {
    background: rgba(157, 78, 221, 0.04);
  }

  .data-table__row:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: -2px;
  }

  .data-table__empty {
    text-align: center;
    color: var(--color-text-tertiary);
    font-style: italic;
    padding: var(--space-5);
  }

  .data-table__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4);
    border-top: 1px solid var(--border);
    font-size: 10px;
    color: var(--color-text-tertiary);
  }

  .data-table__count {
    font-family: var(--font-mono);
  }

  .data-table__caption {
    font-style: italic;
  }

  @media (prefers-reduced-motion: reduce) {
    .data-table__row,
    .data-table__filter,
    .data-table__export,
    .data-table__sort-btn {
      transition: none;
    }
  }
</style>
