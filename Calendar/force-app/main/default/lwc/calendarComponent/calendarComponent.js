import { LightningElement, track } from 'lwc';
import getEventsByDateRange from '@salesforce/apex/CalendarController.getEventsByDateRange';

export default class CalendarComponent extends LightningElement {
    @track currentMonth;
    @track daysInMonth = [];
    @track startDate;
    @track endDate;
    @track selectedEvent = null;
    @track isModalOpen = false;
    @track timeZone = 'NZ'; // Default to NZ time zone
    @track currentTimeZone = 'NZST'; // To display on UI

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
        const totalDays = this.endDate.getDate();
    
        // Pad the grid with empty slots for alignment at the start of the week
        for (let i = 0; i < monthStartDay; i++) {
            days.push({ date: null, dayNumber: null, events: [] });
        }
    
        // Loop through each day in the month
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), day);
            const dayEvents = this.getEventsForDay(date, events);
            days.push({ date: date.toDateString(), dayNumber: day, events: dayEvents });
        }
    
        this.daysInMonth = days;
    }
    
    getEventsForDay(date, events) {
        return events.filter(event => {
            const eventStartDate = this.timeZone === 'NZ' 
                ? new Date(event.Start_Date_NZ__c) 
                : new Date(event.Start_Date_IST__c);
            const eventEndDate = this.timeZone === 'NZ' 
                ? new Date(event.End_Date_NZ__c) 
                : new Date(event.End_Date_IST__c);
    
            // Include events if any part of them overlaps the current day in the calendar
            return (
                eventStartDate <= date && eventEndDate >= date
            );
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
        this.convertTimes(); // Update times whenever timezone is toggled
        this.loadEvents();  // Reload events on toggle change
    }

    closeModal() {
        this.isModalOpen = false;
        this.selectedEvent = null;
    }
}
