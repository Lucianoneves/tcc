import {useContexts} from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../contexts/auth'
import React, { useContext } from 'react';


export default function Private ({children}) {

const {signed, loading} =  useContext(AuthContext);

if(loading){
    return(
        <div></div>
    )
}

if (!signed){
    return <Navigate to ="/login"/>
}
;
    return children;
}