export interface DashboardConfig {
    widgets: GridItem[];
    simulators: string[];
    auto_run: boolean;
}

export interface GridItem {
    plugin: string;
    widget: string;
    boxes: number[];
    options?: any;
}

export type DashboardGridType = {
    [plugin_widget: string]: GridItem;
};

export type DashboardPopup = {
    id: string;
    node: Node;
    isOpen: boolean;
};

export type DashboardPopupsType = {
    [id: string]: DashboardPopup;
};
