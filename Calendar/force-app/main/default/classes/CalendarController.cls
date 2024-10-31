public with sharing class CalendarController {

    @AuraEnabled(cacheable=true)
    public static List<CalendarEvent__c> getEventsByDateRange(Date startDate, Date endDate, String timeZone) {
        String startDateField = timeZone == 'NZ' ? 'Start_Date_NZ__c' : 'Start_Date_IST__c';
        String endDateField = timeZone == 'NZ' ? 'End_Date_NZ__c' : 'End_Date_IST__c';
        
        // Adjust start and end date by a few days outside the range to capture events spanning month boundaries
        Date adjustedStartDate = startDate.addDays(-7);
        Date adjustedEndDate = endDate.addDays(7);
        
        String queryString = 'SELECT Id, Name, Start_Date_NZ__c, End_Date_NZ__c, Start_Date_IST__c, End_Date_IST__c, Description__c, Status__c ' +
                             'FROM CalendarEvent__c ' +
                             'WHERE ' + startDateField + ' <= :adjustedEndDate AND ' + endDateField + ' >= :adjustedStartDate ' +
                             'ORDER BY ' + startDateField + ' ASC';
        
        return Database.query(queryString);
    }
}
