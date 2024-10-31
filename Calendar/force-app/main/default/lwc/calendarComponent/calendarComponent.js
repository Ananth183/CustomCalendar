import { LightningElement, track } from 'lwc';
import getEventsByDateRange from '@salesforce/apex/CalendarController.getEventsByDateRange';

export default class CalendarComponent extends LightningElement {
    @track currentMonth;
    @track daysInMonth = [];
    @track dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Add this line
    @track startDate;
    @track endDate;
    @track selectedEvent = null;
    @track isModalOpen = false;
    @track timeZone = 'NZ'; // Default to NZ time zone
    @track currentTimeZone = 'NZST'; // To display on UI
    @track timeZoneButtonText = 'Time Zone - NZ'; // To display on UI

    @track selectedEventStartTimeNZ;
    @track selectedEventEndTimeNZ;
    @track selectedEventStartTimeIST;
    @track selectedEventEndTimeIST;

    connectedCallback() {
        this.initializeMonth();
        this.loadEvents();
    }

    initializeMonth() {
        const today = new Date();
        this.setMonthRange(today);
        this.updateMonthGrid();
    }

    setMonthRange(date) {
        // Regular start and end dates for the calendar month
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
        this.startDate = start;
        this.endDate = end;
        this.currentMonth = start.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    

    updateMonthGrid(events = []) {
        const days = [];
        const monthStartDay = this.startDate.getDay();
        const totalDaysInMonth = this.endDate.getDate();
        const previousMonthEndDate = new Date(this.startDate);
        previousMonthEndDate.setDate(0); // Last day of the previous month
        const daysInPreviousMonth = previousMonthEndDate.getDate();
    
        // Pad start of the calendar with days from previous month if needed
        for (let i = monthStartDay - 1; i >= 0; i--) {
            const date = new Date(this.startDate.getFullYear(), this.startDate.getMonth() - 1, daysInPreviousMonth - i);
            const dayEvents = this.getEventsForDay(date, events);
            days.push({
                date: date.toDateString(),
                dayNumber: date.getDate(),
                events: dayEvents,
                isInCurrentMonth: false, // Mark as not current month
                isDisabled: true ,// Mark as disabled
                className: this.getDayClass(true)
            });
        }
    
        // Main month loop for each day in October
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const date = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), day);
            const dayEvents = this.getEventsForDay(date, events);
            days.push({
                date: date.toDateString(),
                dayNumber: day,
                events: dayEvents,
                isInCurrentMonth: true,
                isDisabled: false, // Mark as enabled
                className: this.getDayClass(false)
            });
        }
    
        // Include the first few days of November for events that continue from October
        const numberOfNextMonthDaysToShow = 7 - (days.length % 7);
        for (let i = 1; i <= numberOfNextMonthDaysToShow; i++) {
            const nextMonthDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth() + 1, i);
            const dayEvents = this.getEventsForDay(nextMonthDate, events);
            days.push({
                date: nextMonthDate.toDateString(),
                dayNumber: nextMonthDate.getDate(),
                events: dayEvents,
                isInCurrentMonth: false, // Mark as not current month
                isDisabled: true ,
                className: this.getDayClass(true)
            });
        }
    
        // Complete the row by adding any remaining blank days
        while (days.length % 7 !== 0) {
            const extraDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth() + 1, numberOfNextMonthDaysToShow + 1);
            const dayEvents = this.getEventsForDay(extraDate, events);
            days.push({
                date: extraDate.toDateString(),
                dayNumber: extraDate.getDate(),
                events: dayEvents,
                isInCurrentMonth: false, // Mark as not current month
                isDisabled: true,
                className: this.getDayClass(true)
            });
        }
    
        this.daysInMonth = days;
        console.log('days in month---', this.daysInMonth);
    }
    
    
    getDayClass(isDisabled) {
        return isDisabled ? 'calendar-day greyed-out' : 'calendar-day';
    }
    
    
    
    getEventsForDay(date, events) {
        return events.filter(event => {
            const eventStartDate = this.timeZone === 'NZ' 
                ? new Date(event.Start_Date_NZ__c) 
                : new Date(event.Start_Date_IST__c);
            const eventEndDate = this.timeZone === 'NZ' 
                ? new Date(event.End_Date_NZ__c) 
                : new Date(event.End_Date_IST__c);
    
            // Log the comparison details for debugging
            console.log('Checking date:', date);
            console.log('Event Start:', eventStartDate, 'Event End:', eventEndDate);
    
            // Check if the event covers the date (i.e., it starts on or before the date and ends on or after the date)
            const isEventInDay = eventStartDate <= date && eventEndDate >= date;
            if (isEventInDay) {
                console.log('Event matches for date:', date);
            }
            
            return isEventInDay;
        });
    }
    
    
    
    
    
    

    loadEvents() {
        getEventsByDateRange({ 
            startDate: this.startDate, 
            endDate: this.endDate, 
            timeZone: this.timeZone 
        })
        .then(data => {
            this.updateMonthGrid(data);
        })
        .catch(error => {
            console.error('Error loading events', error);
        });
    }
    

    handlePreviousMonth() {
        const prevMonth = new Date(this.startDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        this.setMonthRange(prevMonth);
        this.loadEvents();
    }

    handleNextMonth() {
        const nextMonth = new Date(this.startDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        this.setMonthRange(nextMonth);
        this.loadEvents();
    }

    handleEventClick(event) {
        const selectedEventId = event.currentTarget.dataset.id;
        this.selectedEvent = this.daysInMonth.flatMap(day => day.events).find(evt => evt.Id === selectedEventId);
        this.convertTimes();
        this.isModalOpen = true;
    }

    convertTimes() {
        if (this.selectedEvent) {
            const startTimeNZ = new Date(this.selectedEvent.Start_Date_NZ__c);
            const endTimeNZ = new Date(this.selectedEvent.End_Date_NZ__c);
            const startTimeIST = new Date(this.selectedEvent.Start_Date_IST__c);
            const endTimeIST = new Date(this.selectedEvent.End_Date_IST__c);
            
            // Set times for both NZ and IST
            this.selectedEventStartTimeNZ = startTimeNZ.toLocaleString('en-NZ'); // Format for NZ
            this.selectedEventEndTimeNZ = endTimeNZ.toLocaleString('en-NZ');
            this.selectedEventStartTimeIST = startTimeIST.toLocaleString('en-IN'); // Format for IST
            this.selectedEventEndTimeIST = endTimeIST.toLocaleString('en-IN');
        }
    }

    toggleTimeZone() {
        this.timeZone = this.timeZone === 'NZ' ? 'IST' : 'NZ';
        this.currentTimeZone = this.timeZone === 'NZ' ? 'NZST' : 'IST';
        this.timeZoneButtonText = this.timeZone === 'NZ' ? 'Time Zone - NZ' : 'Time Zone - IST';
        this.convertTimes(); // Update times whenever timezone is toggled
        this.loadEvents();  // Reload events on toggle change
    }

    closeModal() {
        this.isModalOpen = false;
        this.selectedEvent = null;
    }
}