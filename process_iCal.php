<?php
    require('SG-iCalendar-master/SG_iCal.php');

    date_default_timezone_set('America/Los_Angeles');
    
    error_reporting(E_ALL);
    
    if ($_GET['type'] == 'techs') {
    
        file_put_contents("ical_data.txt", file_get_contents("https://universityofwashingtonhfs15.humanity.com/ical/-79685f24ff841d925237d9dee74e2590.ics?1546893206000"));
        $data = file("ical_data.txt");
        $shifts = [];
        
        $monday = date('Y-m-d', strtotime('monday this week'));
        $sunday = date('Y-m-d', strtotime('sunday this week'));
        $ical = new SG_iCalReader("ical_data.txt");
        foreach ($ical->getEvents() as $event) {
            $weekday = strtolower(substr(date('l', $event->getStart()), 0, 3));
            $day = date('Y-m-d', $event->getStart());
            $start = date('g:ia', $event->getStart());
            $end = date('g:ia', $event->getEnd());
            if ($day >= $monday && $day <= $sunday) {
                $info = array('tech' => substr($event->getSummary(), strrpos($event->getSummary(), '(') + 1, -1),
                             'day' => $day,
                             'start' => $start,
                             'end' => $end,
                             'weekday' => $weekday);
                $shifts[] = $info;
            }
        }
        echo json_encode($shifts);
    } else if ($_GET['type'] == 'workshops') {
        file_put_contents("workshop_ical_data.txt", file_get_contents("https://universityofwashingtonhfs15.humanity.com/ical/-c5933be9bfda40b12ed8109cdd60ccab.ics?1547013689000"));
        $data = file("workshop_ical_data.txt");
        $workshops = [];
        $ical = new SG_iCalReader("workshop_ical_data.txt");
        
        $today = date('Y-m-d');
        foreach ($ical->getEvents() as $event) {
            $day = date('Y-m-d', $event->getStart());
            $startDateTime = (new DateTime(date('g:ia', $event->getStart())))->add(new DateInterval('PT30M'));
            $start = $startDateTime->format('g:ia');
            $endDateTime = (new DateTime(date('g:ia', $event->getEnd())))->sub(new DateInterval('PT30M'));
            $end = $endDateTime->format('g:ia');
            if ($day >= $today) {
                $info = array('name' => substr($event->getDescription(), 0, strpos($event->getDescription(), "\n--\n")),
                             'month' => date('M', $event->getStart()),
                             'num' => date('j', $event->getStart()),
                             'start' => $start,
                             'end' => $end,
                             'weekday' => strtolower(substr(date('l', $event->getStart()), 0, 3)));
                $workshops[] = $info;
            }
        }
        echo json_encode($workshops);
    }
?>