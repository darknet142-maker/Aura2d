export type AudioConsumerId =
  | 'MAIN_PLAYER'
  | 'DROPDOWN_DROP_PREVIEW'
  | 'STUDIO_VIDEO_PREVIEW'
  | 'STUDIO_RECORDING_DROP'
  | 'SOCIAL_INLINE_PREVIEW'
  | 'STORY_STATUS_VIEWER'
  | 'ADMIN_UPLOAD_PREVIEW';

class GlobalAudioCoordinator {
  private activeConsumer: AudioConsumerId | null = null;
  private stopHandlers = new Map<AudioConsumerId, () => void>();

  register(id: AudioConsumerId, onForceStop: () => void): () => void {
    this.stopHandlers.set(id, onForceStop);
    return () => {
      this.stopHandlers.delete(id);
      if (this.activeConsumer === id) this.activeConsumer = null;
    };
  }

  claim(id: AudioConsumerId): void {
    this.stopHandlers.forEach((stopFn, consumerId) => {
      if (consumerId !== id) {
        try {
          stopFn();
        } catch {
          // Ignore
        }
      }
    });
    this.activeConsumer = id;
  }

  release(id: AudioConsumerId): void {
    if (this.activeConsumer === id) {
      this.activeConsumer = null;
    }
  }

  forceStopAll(): void {
    this.stopHandlers.forEach((stopFn) => {
      try {
        stopFn();
      } catch {
        // Ignore
      }
    });
    this.activeConsumer = null;
  }

  getActiveConsumer(): AudioConsumerId | null {
    return this.activeConsumer;
  }
}

export const globalAudioCoordinator = new GlobalAudioCoordinator();
