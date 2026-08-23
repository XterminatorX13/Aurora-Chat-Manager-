<script>
  import { createEventDispatcher } from "svelte";

  /** @type {string} */
  export let title = "";
  /** @type {Array<{label: string, description?: string, date?: string, status?: 'completed' | 'current' | 'upcoming'}>} */
  export let events = [];

  const dispatch = createEventDispatcher();

  const statusConfig = {
    completed: {
      dot: "var(--color-success)",
      line: "var(--color-success)",
      bg: "rgba(16, 185, 129, 0.08)",
    },
    current: {
      dot: "var(--highlight)",
      line: "var(--accent-2)",
      bg: "rgba(157, 78, 221, 0.08)",
    },
    upcoming: {
      dot: "var(--color-text-tertiary)",
      line: "var(--border-light)",
      bg: "transparent",
    },
  };

  function getConfig(status) {
    return statusConfig[status] || statusConfig.upcoming;
  }

  function handleEventClick(event, index) {
    dispatch("action", { action: "event_click", event, index });
  }
</script>

<div class="timeline" role="list" aria-label={title || "Timeline"}>
  {#if title}
    <h4 class="timeline__title">{title}</h4>
  {/if}

  <div class="timeline__events">
    {#each events as event, i}
      {@const config = getConfig(event.status)}
      {@const isLast = i === events.length - 1}
      <div
        class="timeline__event"
        class:is-current={event.status === "current"}
        role="button"
        tabindex="0"
        on:click={() => handleEventClick(event, i)}
        on:keydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleEventClick(event, i);
          }
        }}
      >
        <!-- Track -->
        <div class="timeline__track">
          <div
            class="timeline__dot"
            class:is-current={event.status === "current"}
            style="--dot-color: {config.dot};"
            aria-hidden="true"
          >
            {#if event.status === "completed"}
              <span class="timeline__check">✓</span>
            {:else if event.status === "current"}
              <span class="timeline__pulse"></span>
            {/if}
          </div>
          {#if !isLast}
            <div
              class="timeline__line"
              style="--line-color: {config.line};"
              aria-hidden="true"></div>
          {/if}
        </div>

        <!-- Content -->
        <div
          class="timeline__content"
          style="--event-bg: {config.bg};"
        >
          <div class="timeline__event-header">
            <span class="timeline__label">{event.label}</span>
            {#if event.date}
              <span class="timeline__date">{event.date}</span>
            {/if}
          </div>
          {#if event.description}
            <p class="timeline__description">{event.description}</p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .timeline {
    font-family: var(--font-primary);
    contain: content;
  }

  .timeline__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-4) 0;
    letter-spacing: -0.01em;
  }

  .timeline__events {
    display: flex;
    flex-direction: column;
  }

  .timeline__event {
    display: flex;
    gap: var(--space-3);
    cursor: pointer;
    padding: var(--space-1) 0;
    border-radius: var(--radius-small);
    transition: opacity 0.15s ease;
  }

  .timeline__event:hover {
    opacity: 0.9;
  }

  .timeline__event:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  /* ── Track (dot + line) ── */
  .timeline__track {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 20px;
    flex-shrink: 0;
    padding-top: 2px;
  }

  .timeline__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--layer-2);
    border: 2px solid var(--dot-color);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
  }

  .timeline__dot.is-current {
    background: color-mix(in srgb, var(--dot-color) 20%, transparent);
  }

  .timeline__check {
    font-size: 7px;
    color: var(--color-success);
    font-weight: 700;
  }

  .timeline__pulse {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--highlight);
    animation: timelinePulse 2s ease-in-out infinite;
  }

  @keyframes timelinePulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.3); }
  }

  .timeline__line {
    width: 2px;
    flex: 1;
    min-height: 20px;
    background: var(--line-color);
    opacity: 0.3;
  }

  /* ── Content ── */
  .timeline__content {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    background: var(--event-bg);
    border-radius: var(--radius-small);
    margin-bottom: var(--space-2);
  }

  .timeline__event-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .timeline__label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .is-current .timeline__label {
    color: var(--highlight);
  }

  .timeline__date {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-text-tertiary);
    white-space: nowrap;
  }

  .timeline__description {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: var(--space-1) 0 0 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .timeline__event {
      transition: none;
    }
    .timeline__pulse {
      animation: none;
      opacity: 1;
    }
  }
</style>
