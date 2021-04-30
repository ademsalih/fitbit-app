import { Application } from '../lib/view';
import { View, $at } from '../lib/view'
import { listDirSync } from "fs";

const $ = $at( '#main' );

export class Main extends View {
    el = $();

    connected = false;

    onMount(props){
        if (props) this.connected = props.connected;
        
        const newSessionButton = $( '#newSessionButton' );
        newSessionButton.addEventListener("click", this.sessionButtonClickHandler);

        const settingsButton = $( '#settingsButton' );
        settingsButton.addEventListener("click", this.settingsButtonClickHandler);

        let n = 0;
        const listDir = listDirSync("/private/data");
        let dirIter = null;
        while((dirIter = listDir.next()) && !dirIter.done) {
            n+=1;
        }

        console.log(`${n} files`)
    }

    onPropChange(props) {
        if (this.connected != props.connected) {
            this.connected = props.connected;
            this.render();
        }
    }

    onRender(){
        console.log("[Main] onRender()")

        const newSessionButton = $( '#newSessionButton' );
        const mixedtext = $( '#mixedtext' );
        const statusText = mixedtext.getElementById('copy');
        const spinner = $( '#spinner' );
    
        if (this.connected) {
            spinner.state = "disabled";
            spinner.style.display = "none";
            newSessionButton.style.display = "inline";
            statusText.text = "Connected to Nyx"
        } else {
            spinner.state = "enabled";
            spinner.style.display = "inline";
            newSessionButton.style.display = "none";
            statusText.text = "Waiting for Nyx..."
        }
    }

    onUnmount(){
        console.log("[Main] onUnmount()")

        const newSessionButton = $( '#newSessionButton' );
        newSessionButton.removeEventListener("click", this.sessionButtonClickHandler);        
        
        const settingsButton = $( '#settingsButton' );
        settingsButton.removeEventListener("click", this.settingsButtonClickHandler);
    }

    sessionButtonClickHandler = () => {
        if (this.connected) {
            Application.switchTo('RecordView');
        }
    }

    settingsButtonClickHandler = () => {
        Application.switchTo('Settings');
    }

}
