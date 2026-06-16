<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

type WorkPlacement = 'vertical' | 'horizontal';

type Project = {
  title: string;
  client: string;
  year: number;
  role: string;
  category: string;
  format: string;
  summary: string;
  workSection?: string;
  workSectionOrder?: number;
  workSectionSummary?: string;
  thumbnail?: string;
  videoUrl?: string;
  featured: boolean;
  workPlacement?: WorkPlacement;
  url: string;
};

type WorkSectionConfig = {
  id: string;
  title: string;
  order: number;
  summary?: string;
};

type WorkSection = {
  id: string;
  title: string;
  order: number;
  summary?: string;
  projects: Project[];
  verticalProjects: Project[];
  horizontalProjects: Project[];
};

type WorkCopy = {
  eyebrow: string;
  title: string;
  blockLabel: string;
  verticalLabel: string;
  horizontalLabel: string;
};

const props = defineProps<{
  projects: Project[];
  workSections: WorkSectionConfig[];
  copy: WorkCopy;
}>();

const carousel = ref<HTMLElement | null>(null);
const activeSectionId = ref('');
const isDraggingCarousel = ref(false);
const shouldCancelCarouselClick = ref(false);

const workSections = computed<WorkSection[]>(() => {
  const projectsBySection = new Map<string, Project[]>();

  props.projects.forEach((project) => {
    const sectionId = project.workSection?.trim();

    if (!sectionId) {
      return;
    }

    projectsBySection.set(sectionId, [...(projectsBySection.get(sectionId) ?? []), project]);
  });

  return props.workSections
    .map((section) => ({
      ...section,
      projects: projectsBySection.get(section.id) ?? [],
      verticalProjects: [],
      horizontalProjects: [],
    }))
    .filter((section) => section.projects.length > 0)
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const verticalProjects = section.projects.filter((project) => project.workPlacement !== 'horizontal');
      const horizontalProjects = section.projects.filter((project) => project.workPlacement === 'horizontal');

      return {
        ...section,
        verticalProjects,
        horizontalProjects,
      };
    });
});

const activeSection = computed(() => {
  return workSections.value.find((section) => section.id === activeSectionId.value) ?? workSections.value[0];
});

const previewTimers = new WeakMap<HTMLVideoElement, number>();
let dragStartX = 0;
let dragStartScrollLeft = 0;
let dragMoved = false;
let activeCarouselPointerId: number | null = null;
let activeCarouselHref: string | null = null;
let activeCarouselNewTab = false;

function isEmbeddableProvider(url: string) {
  return /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(url);
}

function isDirectVideo(url?: string) {
  if (!url || isEmbeddableProvider(url)) {
    return false;
  }

  return /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(url) || url.startsWith('/uploads/');
}

function hasThumbnail(project: Project) {
  return Boolean(project.thumbnail?.trim());
}

function preparePreview(event: Event) {
  const video = event.currentTarget as HTMLVideoElement;

  if (video.dataset.previewStart || !Number.isFinite(video.duration)) {
    return;
  }

  const duration = video.duration;
  const previewLength = Math.min(duration, 3 + Math.random() * 2);
  const maxStart = Math.max(0, duration - previewLength - 0.25);
  const lower = Math.min(maxStart, duration * 0.25);
  const upper = Math.min(maxStart, Math.max(lower, duration * 0.68));
  const previewStart = upper > lower ? lower + Math.random() * (upper - lower) : lower;

  video.dataset.previewStart = previewStart.toFixed(2);
  video.dataset.previewLength = previewLength.toFixed(2);
  video.currentTime = previewStart;
}

function getCardVideo(event: Event) {
  return (event.currentTarget as HTMLElement).querySelector<HTMLVideoElement>('video[data-preview-video]');
}

async function playPreview(event: Event) {
  const video = getCardVideo(event);

  if (!video) {
    return;
  }

  if (!video.dataset.previewStart && Number.isFinite(video.duration)) {
    preparePreview({ currentTarget: video } as unknown as Event);
  }

  const previewStart = Number(video.dataset.previewStart ?? 0);
  const previewLength = Number(video.dataset.previewLength ?? 4);

  window.clearTimeout(previewTimers.get(video));
  video.currentTime = previewStart;
  video.muted = true;
  video.playsInline = true;

  try {
    await video.play();
  } catch {
    return;
  }

  const timer = window.setTimeout(() => {
    video.pause();
    video.currentTime = previewStart;
  }, previewLength * 1000);

  previewTimers.set(video, timer);
}

function stopPreview(event: Event) {
  const video = getCardVideo(event);

  if (!video) {
    return;
  }

  window.clearTimeout(previewTimers.get(video));
  video.pause();
  video.currentTime = Number(video.dataset.previewStart ?? 0);
}

function startCarouselDrag(event: PointerEvent) {
  if (!carousel.value || (event.pointerType === 'mouse' && event.button !== 0)) {
    return;
  }

  activeCarouselPointerId = event.pointerId;
  isDraggingCarousel.value = true;
  shouldCancelCarouselClick.value = false;
  dragMoved = false;
  dragStartX = event.clientX;
  dragStartScrollLeft = carousel.value.scrollLeft;

  try {
    carousel.value.setPointerCapture(event.pointerId);
  } catch {
    activeCarouselPointerId = null;
  }

  const target = event.target;
  const activeCard = target instanceof Element ? target.closest<HTMLAnchorElement>('a.project-card-vertical') : null;
  activeCarouselHref = activeCard?.href ?? null;
  activeCarouselNewTab = event.metaKey || event.ctrlKey;
}

function moveCarouselDrag(event: PointerEvent) {
  if (!carousel.value || !isDraggingCarousel.value) {
    return;
  }

  if (event.pointerType === 'mouse' && (event.buttons & 1) === 0) {
    cancelCarouselDrag();
    return;
  }

  if (activeCarouselPointerId !== null && event.pointerId !== activeCarouselPointerId) {
    return;
  }

  const deltaX = event.clientX - dragStartX;

  if (Math.abs(deltaX) > 8) {
    dragMoved = true;
    carousel.value.scrollLeft = dragStartScrollLeft - deltaX;
  }
}

function stopCarouselDrag(event: PointerEvent) {
  if (!carousel.value || !isDraggingCarousel.value) {
    return;
  }

  if (activeCarouselPointerId !== null && event.pointerId !== activeCarouselPointerId) {
    return;
  }

  isDraggingCarousel.value = false;
  releaseCarouselPointer();

  if (!dragMoved && activeCarouselHref) {
    shouldCancelCarouselClick.value = true;

    if (activeCarouselNewTab || event.metaKey || event.ctrlKey) {
      window.open(activeCarouselHref, '_blank', 'noopener');
    } else {
      window.location.assign(activeCarouselHref);
    }

    window.setTimeout(() => {
      shouldCancelCarouselClick.value = false;
    }, 120);
    activeCarouselHref = null;
    return;
  }

  if (dragMoved) {
    shouldCancelCarouselClick.value = true;
    window.setTimeout(() => {
      shouldCancelCarouselClick.value = false;
    }, 120);
  }

  activeCarouselHref = null;
}

function releaseCarouselPointer() {
  if (carousel.value && activeCarouselPointerId !== null && carousel.value.hasPointerCapture(activeCarouselPointerId)) {
    try {
      carousel.value.releasePointerCapture(activeCarouselPointerId);
    } catch {
      // The browser may have already released capture.
    }
  }

  activeCarouselPointerId = null;
}

function cancelCarouselDrag() {
  if (!isDraggingCarousel.value) {
    return;
  }

  isDraggingCarousel.value = false;
  dragMoved = false;
  activeCarouselHref = null;
  releaseCarouselPointer();
}

function cancelCarouselDragIfMouseReleased(event: PointerEvent) {
  if (!isDraggingCarousel.value || event.pointerType !== 'mouse') {
    return;
  }

  if ((event.buttons & 1) === 0) {
    cancelCarouselDrag();
  }
}

function cancelCarouselDragOnMouseUp() {
  cancelCarouselDrag();
}

function handleProjectClick(event: MouseEvent) {
  if (!shouldCancelCarouselClick.value) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  shouldCancelCarouselClick.value = false;
}

function selectSection(sectionId: string) {
  activeSectionId.value = sectionId;
  carousel.value?.scrollTo({ left: 0, behavior: 'smooth' });
}

onMounted(() => {
  window.addEventListener('pointerup', stopCarouselDrag);
  window.addEventListener('pointercancel', cancelCarouselDrag);
  window.addEventListener('pointermove', cancelCarouselDragIfMouseReleased);
  window.addEventListener('mouseup', cancelCarouselDragOnMouseUp);
  window.addEventListener('blur', cancelCarouselDrag);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointerup', stopCarouselDrag);
  window.removeEventListener('pointercancel', cancelCarouselDrag);
  window.removeEventListener('pointermove', cancelCarouselDragIfMouseReleased);
  window.removeEventListener('mouseup', cancelCarouselDragOnMouseUp);
  window.removeEventListener('blur', cancelCarouselDrag);
});
</script>

<template>
  <section class="work-section" aria-labelledby="work-heading">
    <span id="work" class="scroll-anchor" aria-hidden="true"></span>
    <div class="section-heading">
      <p class="eyebrow">{{ props.copy.eyebrow }}</p>
      <h2 id="work-heading">{{ props.copy.title }}</h2>
    </div>

    <div v-if="workSections.length > 1" class="work-section-tabs" aria-label="Bloques de trabajo">
      <button
        v-for="section in workSections"
        :key="section.id"
        class="work-section-tab"
        :class="{ active: section.id === activeSection?.id }"
        type="button"
        :aria-pressed="section.id === activeSection?.id"
        @click="selectSection(section.id)"
      >
        <span>{{ section.title }}</span>
        <small>{{ section.projects.length }} {{ section.projects.length === 1 ? 'pieza' : 'piezas' }}</small>
      </button>
    </div>

    <div v-if="activeSection" class="work-section-panel" :key="activeSection.id">
      <div class="work-section-intro">
        <div>
          <p class="work-label">{{ props.copy.blockLabel }}</p>
          <h3>{{ activeSection.title }}</h3>
        </div>
        <p v-if="activeSection.summary">{{ activeSection.summary }}</p>
      </div>

      <div v-if="activeSection.verticalProjects.length" class="work-block">
        <p class="work-label">{{ props.copy.verticalLabel }}</p>

        <div
          ref="carousel"
          class="project-carousel"
          :class="{ dragging: isDraggingCarousel }"
          aria-label="Reels y videos verticales"
          @pointerdown="startCarouselDrag"
        @pointermove="moveCarouselDrag"
        @pointerup="stopCarouselDrag"
        @pointercancel="cancelCarouselDrag"
        @lostpointercapture="cancelCarouselDrag"
      >
          <a
            v-for="(project, index) in activeSection.verticalProjects"
            :key="project.url"
            class="project-card project-card-vertical"
            :href="project.url"
            draggable="false"
            @click="handleProjectClick"
            @dragstart.prevent
            @mouseenter="playPreview"
            @mouseleave="stopPreview"
            @focusin="playPreview"
            @focusout="stopPreview"
          >
            <span class="project-media project-media-vertical">
              <template v-if="isDirectVideo(project.videoUrl)">
                <video
                  data-preview-video
                  :src="project.videoUrl"
                  muted
                  playsinline
                  preload="metadata"
                  @loadedmetadata="preparePreview"
                />
              </template>
              <img v-else-if="hasThumbnail(project)" :src="project.thumbnail" alt="" loading="lazy" />
              <span v-else class="project-media-fallback">Sin medio</span>

              <span class="project-scrim" aria-hidden="true"></span>

              <span class="project-topline">
                <span v-if="project.featured" class="project-badge">Destacado</span>
                <span v-else class="project-kicker">{{ project.category }}</span>
                <span class="project-number">0{{ index + 1 }} / {{ project.year }}</span>
              </span>

              <span class="project-content">
                <span class="project-kicker">{{ project.category }} · {{ project.format }}</span>
                <strong>{{ project.title }}</strong>
                <span class="project-client">{{ project.client }}</span>
                <span class="project-cta">{{ isDirectVideo(project.videoUrl) ? 'Ver pieza' : 'Abrir proyecto' }}</span>
              </span>
            </span>
          </a>
        </div>
      </div>

      <div v-if="activeSection.horizontalProjects.length" class="work-block work-block-horizontal">
        <p class="work-label">{{ props.copy.horizontalLabel }}</p>
        <div class="horizontal-projects">
          <a
            v-for="(project, index) in activeSection.horizontalProjects"
            :key="project.url"
            class="project-card project-card-horizontal"
            :href="project.url"
            @mouseenter="playPreview"
            @mouseleave="stopPreview"
            @focusin="playPreview"
            @focusout="stopPreview"
          >
            <span class="project-media project-media-horizontal">
              <template v-if="isDirectVideo(project.videoUrl)">
                <video
                  data-preview-video
                  :src="project.videoUrl"
                  muted
                  playsinline
                  preload="metadata"
                  @loadedmetadata="preparePreview"
                />
              </template>
              <img v-else-if="hasThumbnail(project)" :src="project.thumbnail" alt="" loading="lazy" />
              <span v-else class="project-media-fallback">Sin medio</span>

              <span class="project-scrim" aria-hidden="true"></span>

              <span class="project-topline">
                <span v-if="project.featured" class="project-badge">Destacado</span>
                <span v-else class="project-kicker">{{ project.category }}</span>
                <span class="project-number">0{{ index + 1 }} / {{ project.year }}</span>
              </span>

              <span class="project-content">
                <span class="project-kicker">{{ project.category }} · {{ project.format }}</span>
                <strong>{{ project.title }}</strong>
                <span class="project-client">{{ project.client }}</span>
                <span class="project-cta">{{ isDirectVideo(project.videoUrl) ? 'Ver pieza' : 'Abrir proyecto' }}</span>
              </span>
            </span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
