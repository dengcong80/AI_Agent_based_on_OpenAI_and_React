// frontend/src/App.js
import React,{useState, useEffect} from 'react';
import {
    Container,
    Box,
    AppBar,
    Toolbar,
    Typography,
    Tabs,
    Tab,
    Paper,
    Alert,
    Snackbar
} from '@mui/material';
import ChatInterface from './components/ChatInterface';
import KnowledgeManager from './components/KnowledgeManager';
import AgentDashboard from './components/AgentDashboard';
import { healthCheck } from './services/api';
import './App.css';

function TabPanel({children,value,index}){
    return (
      <div hidden={value !== index} style={{paddingTop:'20px'}}>
        {value === index && children}
      </div>
    );
}

function App(){
    const [tabValue, setTabValue] = useState(0);
    const [serverStatus, setServerStatus] = useState('checking');
    const [notification, setNotification] = useState({
        open:false,
        message: '',
        severity: 'info'
    });

    // check service connection
    useEffect(()=>{
        const checkServer = async()=>{
            try{
              await healthCheck();
              setServerStatus('connected');
            }catch(error){
              setServerStatus('disconnected');
              showNotification('cannot connect to service,please ensure backend service is running','error');
            }
        };

        checkServer();
        // every 30 seconds check the status of the service
        const interval = setInterval(checkServer,30000);
        return ()=>clearInterval(interval);
    },[]);
    const handleTabChange = (event,newValue)=>{
        setTabValue(newValue);
    };
    const showNotification = (message,severity='info')=>{
        setNotification({
            open:true,
            message,
            severity
        });
    };
    const handleCloseNotification = ()=>{
        setNotification({...notification,open:false});
    };
    return (
        <Box sx={{flexGrow:1,minHeight:'100vh',backgroundColor:'#f5f5f5'}}>
         {/* top navi */}
         <AppBar position='static' elevation={0}>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{flexGrow:1, fontWeight:"bold"}}>
                    AI Agent System
                </Typography>

                {/**indicator of the service */}
                <Box
                 sx={{display:"flex",
                    alignItems:"center",
                    gap:1,
                    padding:"4px 12px",
                    borderRadius:"16px",
                    backgroundColor:"rgba(255,255,255,0.1)"
                 }}
                >
                    <Box
                     sx={{
                        width:8,
                        height:8,
                        borderRadius:"50%",
                        backgroundColor:
                          serverStatus === "connected"?"#4caf50":serverStatus==="disconnected"?"#f44336":"#ff9800"
                     }}/>
                     
                    <Typography variant="body2">
                        {serverStatus==="connected"?"connected": serverStatus==="disconnected"?"not connect":"checking"}
                    </Typography>
                </Box>
            </Toolbar>
         </AppBar>

         {/**label navigator */}
         <Container maxWidth="xl" sx={{mt:3}}>
            <Paper elevation={1}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                  variant="fullWidth">
                    <Tab label="chatting" />
                    <Tab label="knowledge base"/>
                    <Tab label="AI Agent" />
                </Tabs>
            </Paper>
            {/**labels' content */}
            <TabPanel value={tabValue} index={0}>
                <ChatInterface onNotification={showNotification}/>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
                <KnowledgeManager onNotification={showNotification}/>
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
                <AgentDashboard onNotification={showNotification} />
            </TabPanel>
         </Container>

         {/**notification */}
         <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{vertical:"bottom", horizontal:"right"}}
         >
            <Alert
             onClose={handleCloseNotification}
             severity={notification.severity}
             sx={{width:"100%"}}
            >
                {notification.message}
            </Alert>
         </Snackbar>

        </Box>
    );
}

export default App;