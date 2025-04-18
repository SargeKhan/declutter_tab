import {browser} from "wxt/browser";
import ExtMessage, {MessageFrom, MessageType} from "@/entrypoints/types.ts";

export default defineBackground(() => {
    console.log('Hello background!', {id: browser.runtime.id});// background.js

    // @ts-ignore
    browser.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch((error: any) => console.error(error));

    //monitor the event from extension icon click
    browser.action.onClicked.addListener((tab) => {
        console.log("click icon")
        console.log(tab)
        browser.tabs.sendMessage(tab.id!, {messageType: MessageType.clickExtIcon});
    });
    

    console.log('browser.webNavigation')
    console.log(browser.webNavigation)
    browser.webNavigation.onCommitted.addListener((details) => {
        if (details.frameId === 0 && details.transitionType === 'typed') {
            console.log('webnavigation message');
            
        }
    });
    browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
          const tabs = await browser.tabs.query({}); 
            const currentTab = tab; // The tab that was just updated.
            const allTabs = tabs; // All open tabs.
            
            // Send a message to the content script of the current tab.
            const response = await browser.tabs.sendMessage(
                tabId,
                {
                    action: 'tabsList',
                    tabs: allTabs,
                    currentTab: currentTab,
                })
            console.log('Message sent from background to content:', response);
      });

    // background.js
    browser.runtime.onMessage.addListener(async (message: ExtMessage, sender, sendResponse: (message: any) => void) => {
        console.log("background:")
        console.log(message)
        if (message.messageType === MessageType.clickExtIcon) {
            console.log(message)
            return true;
        } else if (message.messageType === MessageType.changeTheme || message.messageType === MessageType.changeLocale) {
            let tabs = await browser.tabs.query({active: true, currentWindow: true});
            console.log(`tabs:${tabs.length}`)
            if (tabs) {
                for (const tab of tabs) {
                    await browser.tabs.sendMessage(tab.id!, message);
                }
            }

        } else if (message.messageType === MessageType.switchAndClose) {
            console.log('received message to switch')
            console.log(message)
            await switchToTab(message.switchToTab?.id!)
            await removeTab(message.currentTab?.id!)
            console.log(';i am don');
        }
        sendResponse('')
    });


});

// Switch to the specific tab by updating its 'active' status
const switchToTab = async (tabId: number) => {
    await browser.tabs.update(tabId, { active: true });
      console.log(`Switched to tab with id: ${tabId}`);
  };
  
  // Close the tab with the specified ID
const removeTab = async (tabId: number) => {
    await browser.tabs.remove(tabId)
    console.log(`Closed tab with id: ${tabId}`);
};
