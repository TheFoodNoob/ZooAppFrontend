import React from "react";
import { div } from "framer-motion/client";
import {Link} from "react-router-dom";
export default function Events(){

    return (
    <div className="page">
        <h1>Upcoming Events</h1>
        <div className="panel">
            <h3>Today</h3>
        </div>
        <Link to ="/scheduleEvents">
        <h3 className="btn"> Schedule Events</h3>
        </Link>
    </div>
    );

}