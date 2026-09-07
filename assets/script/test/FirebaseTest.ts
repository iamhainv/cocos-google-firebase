/**
 * FirebaseTest — runtime demo for the Cocos Firebase extension.
 *
 * Builds its whole UI in code (no scene-baked buttons), the same way as the
 * Cocos Share demo, so the example stays readable in a single file. Attach
 * this component to any Node in a scene with a UI camera (see
 * assets/scene/main.scene) and it lays out five buttons plus a scrolling
 * log area:
 *
 *   - Log Event          — Analytics.logEvent('demo_button_tap', { source: 'FirebaseTest' })
 *   - Set User Property   — Analytics.setUserProperty('favorite_color', 'blue')
 *   - Force Test Crash    — Crashlytics.testCrash() (DEBUG ONLY — kills the app on purpose)
 *   - Fetch Remote Config — RemoteConfig.fetchActivate() then reads a sample key
 *   - Get FCM Token       — Messaging.requestPermission() then Messaging.getToken()
 *
 * On web preview / editor (non-native), FirebaseBridge has no native
 * JsbBridgeWrapper to talk to, so every call either logs a "(no native)"
 * fire-and-forget line or times out to `null`/`false` after ~15s — this
 * component surfaces both cases in the log instead of hanging silently.
 */

import { _decorator, Component, Node, Label, Graphics, Color, UITransform, Vec3, sys } from 'cc';
import { Analytics } from 'db://firebase/client/Analytics';
import { Crashlytics } from 'db://firebase/client/Crashlytics';
import { RemoteConfig } from 'db://firebase/client/RemoteConfig';
import { Messaging } from 'db://firebase/client/Messaging';

const { ccclass } = _decorator;

const TAG = '[FirebaseTest]';
const MAX_LOG_LINES = 12;

@ccclass('FirebaseTest')
export class FirebaseTest extends Component {

    private _logLabel: Label | null = null;
    private _logLines: string[] = [];

    onLoad() {
        this._buildUI();
        this._log(
            sys.isNative
                ? 'Ready. Tap a button to exercise the Firebase bridge.'
                : 'Web/editor preview — the native bridge is a no-op here; ' +
                  'requests will time out. Build to Android/iOS to test for real.',
        );
    }

    // -----------------------------------------------------------------
    // UI construction (no scene-baked prefabs — everything built in code)
    // -----------------------------------------------------------------

    private _buildUI(): void {
        const root = this.node;
        const rootUi = root.getComponent(UITransform) ?? root.addComponent(UITransform);
        rootUi.setContentSize(640, 720);

        this._addLabel(root, 'Cocos Firebase Demo', 0, 330, 26, true);

        this._addButton(root, 'Log Event', 255, () => this._onLogEvent());
        this._addButton(root, 'Set User Property', 195, () => this._onSetUserProperty());
        this._addButton(root, 'Force Test Crash', 135, () => this._onTestCrash());
        this._addButton(root, 'Fetch Remote Config', 75, () => this._onFetchRemoteConfig());
        this._addButton(root, 'Get FCM Token', 15, () => this._onGetFcmToken());

        // Log area: a single left-aligned, top-anchored Label that we rewrite with the
        // last MAX_LOG_LINES lines joined by newlines — simplest possible "scrolling" log
        // that needs no ScrollView/Layout components.
        const logNode = new Node('Log');
        root.addChild(logNode);
        logNode.setPosition(new Vec3(0, -260, 0));
        const logUi = logNode.addComponent(UITransform);
        logUi.setContentSize(600, 300);
        const logBg = logNode.addComponent(Graphics);
        logBg.fillColor = new Color(0, 0, 0, 120);
        logBg.roundRect(-300, -150, 600, 300, 8);
        logBg.fill();

        const logTextNode = new Node('LogText');
        logNode.addChild(logTextNode);
        logTextNode.setPosition(new Vec3(-290, 140, 0));
        const logTextUi = logTextNode.addComponent(UITransform);
        logTextUi.setContentSize(580, 280);
        this._logLabel = logTextNode.addComponent(Label);
        this._logLabel.string = '';
        this._logLabel.fontSize = 15;
        this._logLabel.lineHeight = 19;
        this._logLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this._logLabel.verticalAlign = Label.VerticalAlign.TOP;
        this._logLabel.overflow = Label.Overflow.CLAMP;
        this._logLabel.color = new Color(200, 255, 200, 255);
    }

    private _addLabel(parent: Node, text: string, x: number, y: number, fontSize: number, bold: boolean): Label {
        const node = new Node('Label');
        parent.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        const ui = node.addComponent(UITransform);
        ui.setContentSize(600, 60);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.RESIZE_HEIGHT;
        label.color = new Color(255, 255, 255, 255);
        return label;
    }

    private _addButton(parent: Node, text: string, y: number, onClick: () => void): Node {
        const node = new Node(`Button_${text.replace(/\s+/g, '')}`);
        parent.addChild(node);
        node.setPosition(new Vec3(0, y, 0));

        const ui = node.addComponent(UITransform);
        ui.setContentSize(360, 48);

        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(43, 108, 176, 255);
        graphics.roundRect(-180, -24, 360, 48, 10);
        graphics.fill();

        const labelNode = new Node('Label');
        node.addChild(labelNode);
        const labelUi = labelNode.addComponent(UITransform);
        labelUi.setContentSize(360, 48);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 18;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.color = new Color(255, 255, 255, 255);

        node.on(Node.EventType.TOUCH_END, () => onClick(), this);

        return node;
    }

    private _log(text: string): void {
        this._logLines.push(text);
        if (this._logLines.length > MAX_LOG_LINES) {
            this._logLines.splice(0, this._logLines.length - MAX_LOG_LINES);
        }
        if (this._logLabel) {
            this._logLabel.string = this._logLines.join('\n');
        }
        console.log(TAG, text);
    }

    // -----------------------------------------------------------------
    // Button handlers
    // -----------------------------------------------------------------

    private _onLogEvent(): void {
        Analytics.logEvent('demo_button_tap', { source: 'FirebaseTest', ts: Date.now() });
        this._log('Analytics.logEvent("demo_button_tap") sent.');
    }

    private _onSetUserProperty(): void {
        Analytics.setUserProperty('favorite_color', 'blue');
        this._log('Analytics.setUserProperty("favorite_color", "blue") sent.');
    }

    private _onTestCrash(): void {
        this._log('Crashlytics.testCrash() — the app will crash now (DEBUG ONLY).');
        // Give the log line a tick to flush before the native side kills the process.
        this.scheduleOnce(() => Crashlytics.testCrash(), 0.05);
    }

    private async _onFetchRemoteConfig(): Promise<void> {
        this._log('Fetching + activating Remote Config...');
        try {
            RemoteConfig.setDefaults({ welcome_message: 'Hello (default)' });
            const activated = await RemoteConfig.fetchActivate(0);
            const value = RemoteConfig.getString('welcome_message', '(not set)');
            this._log(`Remote Config fetchActivate ${activated ? 'succeeded' : 'timed out / failed'}. welcome_message="${value}"`);
        } catch (e) {
            this._log(`Remote Config fetch failed: ${String(e)}`);
        }
    }

    private async _onGetFcmToken(): Promise<void> {
        this._log('Requesting notification permission...');
        try {
            const granted = await Messaging.requestPermission();
            this._log(`Notification permission ${granted ? 'granted' : 'denied / timed out'}.`);
            const token = await Messaging.getToken();
            this._log(token ? `FCM token: ${token}` : 'FCM token unavailable (timed out or not ready yet).');
        } catch (e) {
            this._log(`Get FCM token failed: ${String(e)}`);
        }
    }
}
