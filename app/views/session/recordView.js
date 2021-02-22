import { Application } from '../../lib/view';
import { View, $at } from '../../lib/view'
import { AccelerometerReading } from '../../reading/AccelerometerReading';
import { Accelerometer } from "accelerometer";
import { HeartRateSensor } from "heart-rate";
import { HeartRateReading } from '../../reading/HeartRateReading';
import * as messaging from "messaging";
import Session from '../../sensor/Session';
import { SensorManager } from '../../sensor/SensorManager';

const $ = $at( '#recordView' );

export class RecordView extends View {
    // Root view element used to show/hide the view.
    el = $(); // Extract #screen-1 element.

    running = false;
    eventCount;
    session;
    sessionControlButton = $('#sessionControlButton');
    hrm = new HeartRateSensor({ frequency: 1});
    acc = new Accelerometer({ frequency: 1});

    sensorManager;
    
    onMount(){
        console.log("[RecordView] onMount()");
        
        messaging.peerSocket.addEventListener("message", this.onMessageHandler);
        this.sessionControlButton.addEventListener("click", this.startSessionButtonHandler.bind(this));

        this.eventCount = 0;
        this.session = new Session();

        this.hrm.onreading = this.heartRateEventHandler.bind(this);
        this.acc.onreading = this.acceleroemterEventHandler.bind(this);

        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            messaging.peerSocket.send({
                command: "INIT_SESSION",
                data: {
                    sessionIdentifier: this.session.getIdentifier()
                }
            });
        }
    }

    acceleroemterEventHandler() {
        const reading = new AccelerometerReading(this.session.getIdentifier(), this.acc.x, this.acc.y, this.acc.z);

        this.eventCount += 1;

        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            messaging.peerSocket.send({
                command: "ADD_READING",
                data: reading.get()
            })
        }
    }

    heartRateEventHandler() {
        const reading = new HeartRateReading(this.session.getIdentifier(), this.hrm.heartRate);

        this.eventCount += 1;

        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            messaging.peerSocket.send({
                command: "ADD_READING",
                data: reading.get()
            });
        }
    }

    onRender(){

    }

    onUnmount(){
        this.hrm.onreading = null;
        this.acc.onreading = null;

        messaging.peerSocket.removeEventListener("message", this.onMessageHandler);
        let sessionMixedText = $('#sessionMixedText');
        let sessionMixedTextHeader = sessionMixedText.getElementById("header");
        let sessionMixedTextCopy = sessionMixedText.getElementById("copy");
    
        sessionMixedTextHeader.text = "Connected to Nyx";
        sessionMixedTextHeader.style.fill = "fb-blue"
        sessionMixedTextCopy.text = "Press the button below to start a new session.";
    
        let sessionControlButton = $('#sessionControlButton');
        sessionControlButton.style.fill = "fb-mint"
    
        let sessionControlButtonText = sessionControlButton.getElementById("text");
        sessionControlButtonText.text = "Start Session"
        

        let sessionControlButton = $('#sessionControlButton');
        sessionControlButton.removeEventListener("click", this.startSessionButtonHandler);
    }

    onKeyBack(e) {
        e.preventDefault();

        if (!this.running) {
            Application.switchTo('Main');
        } else {
            // Change text to "End session before exit""
        }
    }
    
    onMessageHandler = (evt) => {
        console.log(`[RecordView] Message from Companion: ${evt.data}`)
        switch (evt.data) {
            case "DISCONNECT":
                console.log("Lost connection, switing to Search...");
                Application.switchTo('Search');
                break;
            default:
                break;
        }
    }

    /**
     * This method in invoked when the Start Session button
     * is pressed and controls the sensors accordingly. 
     */
    startSessionButtonHandler() {
        if (this.running) {
            if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
                messaging.peerSocket.send({
                    command: "STOP_SESSION",
                    data: {
                        sessionIdentifier: this.session.getIdentifier(),
                        endTime: Date.now()
                    }
                });
            }

            this.running = false;

            this.hrm.stop();
            this.acc.stop();

            Application.switchToWithState('Summary', this.eventCount);
        } else {
            if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
                messaging.peerSocket.send({
                    command: "START_SESSION",
                    data: {
                        sessionIdentifier: this.session.getIdentifier(),
                        startTime: Date.now()
                    }
                });
            }
            this.running = true;

            this.hrm.start();
            this.acc.start();

            let sessionMixedText = $('#sessionMixedText');
            let sessionMixedTextHeader = sessionMixedText.getElementById("header");
            let sessionMixedTextCopy = sessionMixedText.getElementById("copy");
        
            sessionMixedTextHeader.text = "Recording...";
            sessionMixedTextHeader.style.fill = "fb-red"
            sessionMixedTextCopy.text = "Press the button below to stop recording.";
        
            let sessionControlButton = $('#sessionControlButton');
            sessionControlButton.style.fill = "fb-red"
        
            let sessionControlButtonText = sessionControlButton.getElementById("text");
            sessionControlButtonText.text = "End Session"
        }
    }

    

}
