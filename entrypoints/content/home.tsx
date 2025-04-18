// <reference types="chrome" />
import React, { useState, useEffect, useCallback } from 'react'
import {Tabs} from "wxt/browser";
import { Youtube } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageType, Tab } from '../types';


function getDomainFromUrl(url: string) {
    const regex = /^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i;
    const match = url.match(regex);
    return match ? match[1] : null; // Return the domain if found
}

export function Home(): JSX.Element {
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [similarTabs, setSimilarTabs] = useState<Tab[]>([])
  const [currentTab, setCurrentTab] = useState<Tab>()

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isVisible) return;
    
    if (event.key === ',') {
      // Setup to listen for the next key press
      const numHandler = (e: KeyboardEvent) => {
        const num = parseInt(e.key);
        // Check if the key is a number and within the range of our tabs
        if (!isNaN(num) && num > 0 && num <= similarTabs.length) {
          // Subtract 1 because array is 0-indexed but our UI shows 1-indexed
          handleTabClick(similarTabs[num - 1]);
        }
        // Remove this event listener after handling
        window.removeEventListener('keydown', numHandler);
      };
      
      // Add a one-time listener for the number key
      window.addEventListener('keydown', numHandler, { once: true });
    }
  }, [isVisible, similarTabs]);

  useEffect(() => {
    // Add the keyboard event listener
    window.addEventListener('keydown', handleKeyPress);
    
    // Remove the event listener on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
      browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          console.log("Message received", message);
          if (message.action === 'tabsList') {
              const { tabs, currentTab: currentTabFromMessage }: { tabs: Tabs.Tab[], currentTab: Tabs.Tab } = message;

              

              console.log('Open Tabs:', tabs);
              console.log('Current Tab:', currentTabFromMessage);

              const tabsWithSameDomain = tabs
                  .filter(tab => getDomainFromUrl(tab.url!) === getDomainFromUrl(currentTabFromMessage.url!))
                  .filter(tab => tab.id! !== currentTabFromMessage.id!)
                  .map(tab => ({
                      id: tab.id!,
                      title: tab.title!,
                      url: tab.url!,
                      favIconUrl: tab.favIconUrl!
                  }));
              setSimilarTabs(tabsWithSameDomain)
              setIsVisible(true)
              setCurrentTab({
                      id: currentTabFromMessage.id!,
                      title: currentTabFromMessage.title!,
                      url: currentTabFromMessage.url!,
                      favIconUrl: currentTabFromMessage.favIconUrl!
                  })
              sendResponse();
          }
      });
      const duration = 10000 // 10 seconds
      const interval = 50 // Update every 50ms

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = oldProgress + (interval / duration) * 100
        if (newProgress >= 100) {
          clearInterval(timer)
          setIsVisible(false)
          return 100
        }
        return newProgress
      })
    }, interval)

    return () => clearInterval(timer)
  }, [])

  const handleTabClick = async (switchToTab: Tab) => {
    console.log('sending message')
    await browser.runtime.sendMessage({
        messageType: MessageType.changeTheme,
    });
    await browser.runtime.sendMessage({
        messageType: MessageType.switchAndClose,
        currentTab,
        switchToTab,
    })
    // chrome.tabs.update(tabId, { active: true })
  }

  const handleTabClose = (tab: Tab) => {
    //chrome.tabs.remove(tabId)
  }

  /// <reference types="chrome" />


  if (!isVisible) return <></> 

  return (
    <Card className="fixed top-4 right-4 w-100 bg-white bg-opacity-90 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium truncate pr-4">
          Currently open tabs from the website
        </CardTitle>
        <div className="relative h-6 w-6">
          <svg className="absolute top-0 left-0 h-6 w-6" viewBox="0 0 24 24">
            <circle
              className="text-primary"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="62.83185307179586"
              strokeDashoffset={62.83185307179586 * (1 - progress / 100)}
              transform="rotate(-90 12 12)"
            />
          </svg>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {similarTabs.map((tab, index) => (
            <li key={tab.id} className="flex items-center space-x-2">
              <img src={tab.favIconUrl} alt="Favicon" className="h-4 w-4 flex-shrink-0" />
              <button
                onClick={() => handleTabClick(tab)}
                className="text-sm text-left hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 truncate flex-grow"
              >
                {tab.title}
              </button>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                , + {index + 1}
              </span>
              <button
                onClick={() => handleTabClose(tab)}
                className="text-xs text-red-500 hover:underline"
              >
                Close
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
