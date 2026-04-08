// React Component Debugger for CUT GRC Platform
// This tool provides real-time React component tree visualization and debugging

class ReactComponentDebugger {
    constructor() {
        this.componentTree = [];
        this.renderCounts = new Map();
        this.propChanges = new Map();
        this.stateChanges = new Map();
        this.isEnabled = false;
        this.originalCreateElement = null;
        this.originalUseState = null;
        this.originalUseEffect = null;
        
        this.init();
    }

    init() {
        // Check if React is available
        if (!window.React || !window.React.createElement) {
            console.warn('React not found. Debugger will work in simulation mode.');
            return;
        }

        this.setupReactHooks();
        this.setupConsoleCommands();
        this.createDebugPanel();
    }

    setupReactHooks() {
        // Store original React methods
        this.originalCreateElement = window.React.createElement;
        this.originalUseState = window.React.useState;
        this.originalUseEffect = window.React.useEffect;

        // Override createElement to track component creation
        window.React.createElement = (type, props, ...children) => {
            const componentName = this.getComponentName(type);
            
            if (componentName && this.isEnabled) {
                this.trackComponent(componentName, props, children);
            }
            
            return this.originalCreateElement.call(this, type, props, ...children);
        };

        // Override useState to track state changes
        if (this.originalUseState) {
            window.React.useState = (initialState) => {
                const [state, setState] = this.originalUseState(initialState);
                
                const wrappedSetState = (newState) => {
                    if (this.isEnabled) {
                        const stack = new Error().stack;
                        const componentName = this.getComponentNameFromStack(stack);
                        if (componentName) {
                            this.trackStateChange(componentName, state, newState);
                        }
                    }
                    return setState(newState);
                };
                
                return [state, wrappedSetState];
            };
        }

        console.log('✅ React Component Debugger hooks installed');
    }

    setupConsoleCommands() {
        // Add debug commands to console
        window.__reactDebug = {
            enable: () => this.enable(),
            disable: () => this.disable(),
            getTree: () => this.getComponentTree(),
            getStats: () => this.getComponentStats(),
            clear: () => this.clear(),
            export: () => this.exportData()
        };

        console.log('🔧 React Debug Commands:');
        console.log('  __reactDebug.enable()  - Enable component tracking');
        console.log('  __reactDebug.disable() - Disable component tracking');
        console.log('  __reactDebug.getTree() - Get component tree');
        console.log('  __reactDebug.getStats() - Get rendering statistics');
        console.log('  __reactDebug.clear()   - Clear debug data');
        console.log('  __reactDebug.export()  - Export debug data');
    }

    createDebugPanel() {
        // Create floating debug panel
        if (document.getElementById('react-debug-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'react-debug-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1e293b;
            color: white;
            border-radius: 8px;
            padding: 12px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
            max-height: 500px;
            overflow: auto;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #374151;
        `;

        const title = document.createElement('div');
        title.textContent = '⚛️ React Debugger';
        title.style.fontWeight = 'bold';

        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = this.isEnabled ? 'ON' : 'OFF';
        toggleBtn.style.cssText = `
            background: ${this.isEnabled ? '#10b981' : '#ef4444'};
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 11px;
            cursor: pointer;
        `;
        toggleBtn.onclick = () => {
            this.isEnabled ? this.disable() : this.enable();
            toggleBtn.textContent = this.isEnabled ? 'ON' : 'OFF';
            toggleBtn.style.background = this.isEnabled ? '#10b981' : '#ef4444';
        };

        header.appendChild(title);
        header.appendChild(toggleBtn);

        const content = document.createElement('div');
        content.id = 'react-debug-content';
        content.style.cssText = `
            font-size: 11px;
            line-height: 1.4;
        `;

        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);

        this.updateDebugPanel();
    }

    updateDebugPanel() {
        const content = document.getElementById('react-debug-content');
        if (!content) return;

        const stats = this.getComponentStats();
        
        content.innerHTML = `
            <div style="margin-bottom: 8px;">
                <strong>Status:</strong> ${this.isEnabled ? '🟢 Active' : '🔴 Inactive'}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Components Tracked:</strong> ${stats.totalComponents}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Total Renders:</strong> ${stats.totalRenders}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>State Changes:</strong> ${stats.stateChanges}
            </div>
            <div style="margin-top: 12px; font-size: 10px; color: #9ca3af;">
                Last update: ${new Date().toLocaleTimeString()}
            </div>
        `;

        // Update every 2 seconds
        if (this.isEnabled) {
            setTimeout(() => this.updateDebugPanel(), 2000);
        }
    }

    enable() {
        this.isEnabled = true;
        console.log('✅ React Component Debugger enabled');
        this.updateDebugPanel();
    }

    disable() {
        this.isEnabled = false;
        console.log('⏸️ React Component Debugger disabled');
        this.updateDebugPanel();
    }

    trackComponent(name, props, children) {
        const timestamp = Date.now();
        
        // Update render count
        const count = this.renderCounts.get(name) || 0;
        this.renderCounts.set(name, count + 1);

        // Track component in tree
        const componentInfo = {
            name,
            props: this.sanitizeProps(props),
            childrenCount: Array.isArray(children) ? children.length : 0,
            timestamp,
            renderId: count + 1
        };

        this.componentTree.push(componentInfo);

        // Keep only last 100 components
        if (this.componentTree.length > 100) {
            this.componentTree.shift();
        }

        // Log to console if enabled
        if (this.isEnabled && count < 5) { // Only log first 5 renders
            console.log(`📦 ${name} rendered (${count + 1}x)`, componentInfo.props);
        }
    }

    trackStateChange(componentName, oldState, newState) {
        const changes = this.stateChanges.get(componentName) || [];
        changes.push({
            timestamp: Date.now(),
            oldState: this.sanitizeState(oldState),
            newState: this.sanitizeState(newState)
        });
        
        this.stateChanges.set(componentName, changes.slice(-10)); // Keep last 10 changes
    }

    getComponentName(type) {
        if (typeof type === 'string') {
            return type;
        } else if (type && type.displayName) {
            return type.displayName;
        } else if (type && type.name) {
            return type.name;
        } else if (type && type.$$typeof) {
            return 'ReactElement';
        }
        return 'Anonymous';
    }

    getComponentNameFromStack(stack) {
        if (!stack) return null;
        
        // Extract component name from React stack trace
        const lines = stack.split('\n');
        for (const line of lines) {
            const match = line.match(/at\s+(\w+)/);
            if (match && match[1] && match[1].match(/^[A-Z]/)) {
                return match[1];
            }
        }
        return null;
    }

    sanitizeProps(props) {
        if (!props || typeof props !== 'object') return props;
        
        const sanitized = {};
        for (const [key, value] of Object.entries(props)) {
            if (key === 'children') continue;
            
            if (typeof value === 'function') {
                sanitized[key] = '[Function]';
            } else if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    sanitized[key] = `[Array(${value.length})]`;
                } else if (value.$$typeof) {
                    sanitized[key] = '[ReactElement]';
                } else {
                    sanitized[key] = '[Object]';
                }
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    sanitizeState(state) {
        if (typeof state === 'object' && state !== null) {
            if (Array.isArray(state)) {
                return `[Array(${state.length})]`;
            } else {
                return '[Object]';
            }
        }
        return state;
    }

    getComponentTree() {
        return {
            timestamp: new Date().toISOString(),
            totalComponents: this.componentTree.length,
            components: this.componentTree.slice(-20), // Last 20 components
            renderCounts: Object.fromEntries(this.renderCounts),
            stateChanges: Object.fromEntries(
                Array.from(this.stateChanges.entries()).map(([key, value]) => [key, value.slice(-5)])
            )
        };
    }

    getComponentStats() {
        const totalRenders = Array.from(this.renderCounts.values()).reduce((a, b) => a + b, 0);
        const totalStateChanges = Array.from(this.stateChanges.values()).reduce((a, b) => a + b.length, 0);
        
        return {
            totalComponents: this.renderCounts.size,
            totalRenders,
            stateChanges: totalStateChanges,
            mostRendered: Array.from(this.renderCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }))
        };
    }

    clear() {
        this.componentTree = [];
        this.renderCounts.clear();
        this.propChanges.clear();
        this.stateChanges.clear();
        console.log('🧹 React debug data cleared');
        this.updateDebugPanel();
    }

    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            componentTree: this.componentTree,
            renderCounts: Object.fromEntries(this.renderCounts),
            stateChanges: Object.fromEntries(this.stateChanges),
            stats: this.getComponentStats()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportName = `react-debug-${new Date().toISOString().slice(0, 10)}.json`;

        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', exportName);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('💾 React debug data exported');
        return data;
    }

    // Visualization methods
    visualizeTree() {
        const treeData = this.buildHierarchy();
        this.renderTreeVisualization(treeData);
    }

    buildHierarchy() {
        // Build component hierarchy based on render order and nesting
        const hierarchy = { name: 'App', children: [] };
        let currentParent = hierarchy;
        const parentStack = [hierarchy];

        for (const component of this.componentTree.slice(-50)) {
            // Simple heuristic for nesting based on component names
            if (component.name.includes('Provider') || component.name.includes('Router')) {
                const node = { name: component.name, children: [] };
                currentParent.children.push(node);
                parentStack.push(node);
                currentParent = node;
            } else if (component.name.includes('Button') || component.name.includes('Input')) {
                // Leaf nodes
                currentParent.children.push({ name: component.name });
            }
        }

        return hierarchy;
    }

    renderTreeVisualization(treeData) {
        // Create a simple tree visualization
        const vizPanel = document.createElement('div');
        vizPanel.id = 'react-tree-viz';
        vizPanel.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px;
            max-width: 300px;
            max-height: 400px;
            overflow: auto;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        const renderNode = (node, depth = 0) => {
            const div = document.createElement('div');
            div.style.paddingLeft = `${depth * 20}px`;
            div.style.margin = '4px 0';
            div.style.fontFamily = 'monospace';
            div.style.fontSize = '12px';
            
            if (node.children && node.children.length > 0) {
                div.innerHTML = `<strong>📁 ${node.name}</strong>`;
                node.children.forEach(child => {
                    div.appendChild(renderNode(child, depth + 1));
                });
            } else {
                div.textContent = `📄 ${node.name}`;
            }
            
            return div;
        };

        vizPanel.appendChild(renderNode(treeData));

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #666;
        `;
        closeBtn.onclick = () => vizPanel.remove();
        vizPanel.appendChild(closeBtn);

        document.body.appendChild(vizPanel);
    }
}

// Auto-initialize if React is detected
if (typeof window !== 'undefined') {
    setTimeout(() => {
        if (window.React) {
            window.ReactDebugger = new ReactComponentDebugger();
            console.log('⚛️ React Component Debugger initialized');
        }
    }, 1000);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReactComponentDebugger;
}