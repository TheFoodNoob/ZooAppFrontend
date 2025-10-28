import React from "react";
import { div } from "framer-motion/client";
export default function Employees(){

    return (
    //pull employees from api if possible
    <div className="page">
        <h1>Our Employees</h1>
        <div className="panel">
            <h3>Dustin Dinh</h3>
            <p>Our zookeeper</p>
        </div>
        <div className="panel">
            <h3>Ryan Stephens</h3>
            <p>Our CEO</p>
        </div>
        <div className="panel">
            <h3>Edwin Garcia</h3>
            <p> our security guard</p>
        </div>
    </div>
    );

}