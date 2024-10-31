trigger EventDateSynchronizer on CalendarEvent__c (before insert, before update) {
    // Timezone offsets in seconds
    Integer IST_TO_NZST_OFFSET = 27000; // 7 hours and 30 minutes (27000 seconds)
    Integer NZST_TO_IST_OFFSET = -27000; // -7 hours and 30 minutes (-27000 seconds)

    for (CalendarEvent__c record : Trigger.new) {
        // Synchronize Start Dates
        if (record.Start_Date_IST__c != null) {
            // Convert IST to NZST for Start Date
            record.Start_Date_NZ__c = record.Start_Date_IST__c.addSeconds(IST_TO_NZST_OFFSET);
        } else if (record.Start_Date_NZ__c != null) {
            // Convert NZST to IST for Start Date
            record.Start_Date_IST__c = record.Start_Date_NZ__c.addSeconds(NZST_TO_IST_OFFSET);
        }
        
        // Synchronize End Dates
        if (record.End_Date_IST__c != null) {
            // Convert IST to NZST for End Date
            record.End_Date_NZ__c = record.End_Date_IST__c.addSeconds(IST_TO_NZST_OFFSET);
        } else if (record.End_Date_NZ__c != null) {
            // Convert NZST to IST for End Date
            record.End_Date_IST__c = record.End_Date_NZ__c.addSeconds(NZST_TO_IST_OFFSET);
        }
    }
}