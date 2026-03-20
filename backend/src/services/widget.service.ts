/**
 * Widget Service
 * Handles widget-related business logic
 */

export interface Widget {
  id: string;
  dashboardId: string;
  type: string;
  config: string; // JSON string
  position: string; // JSON string
  createdAt: Date;
}

export interface CreateWidgetInput {
  dashboardId: string;
  type: string;
  config?: Record<string, any>;
  position?: Record<string, any>;
}

export interface UpdateWidgetInput {
  type?: string;
  config?: Record<string, any>;
  position?: Record<string, any>;
}

class WidgetService {
  private widgets: Map<string, Widget> = new Map();

  /**
   * Find all widgets for a dashboard
   */
  findByDashboard(dashboardId: string): Widget[] {
    return Array.from(this.widgets.values()).filter(
      (w) => w.dashboardId === dashboardId
    );
  }

  findById(id: string): Widget | undefined {
    return this.widgets.get(id);
  }

  create(input: CreateWidgetInput): Widget {
    const widget: Widget = {
      id: crypto.randomUUID(),
      dashboardId: input.dashboardId,
      type: input.type,
      config: JSON.stringify(input.config || {}),
      position: JSON.stringify(input.position || { x: 0, y: 0, w: 4, h: 4 }),
      createdAt: new Date(),
    };

    this.widgets.set(widget.id, widget);
    return widget;
  }

  update(id: string, updates: UpdateWidgetInput): Widget | undefined {
    const widget = this.widgets.get(id);
    if (!widget) {
      return undefined;
    }

    const updatedWidget: Widget = {
      ...widget,
      ...(updates.type && { type: updates.type }),
      ...(updates.config && { config: JSON.stringify(updates.config) }),
      ...(updates.position && { position: JSON.stringify(updates.position) }),
    };

    this.widgets.set(id, updatedWidget);
    return updatedWidget;
  }

  delete(id: string): boolean {
    return this.widgets.delete(id);
  }
}

export const widgetService = new WidgetService();
