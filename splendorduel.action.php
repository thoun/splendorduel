<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * SplendorDuel implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * splendorduel.action.php
 *
 * SplendorDuel main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/splendorduel/splendorduel/myAction.html", ...)
 *
 */
  
  
  class action_splendorduel extends APP_GameAction
  { 
    // Constructor: please do not modify
   	public function __default()
  	{
  	    if( self::isArg( 'notifwindow') )
  	    {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = self::getArg( "table", AT_posint, true );
  	    }
  	    else
  	    {
            $this->view = "splendorduel_splendorduel";
            self::trace( "Complete reinitialization of board game" );
      }
  	} 

    public function takeTokens() {
        self::setAjaxMode();   

        $idsStr = self::getArg( "ids", AT_numberlist, true );
        $ids = array_map(fn($str) => intval($str), explode(',', $idsStr));
        $this->game->takeTokens($ids);

        self::ajaxResponse();
    }

    public function skip() {
        self::setAjaxMode();

        $this->game->skip();

        self::ajaxResponse();
    } 

    public function skipBoth() {
        self::setAjaxMode();

        $this->game->skipBoth();

        self::ajaxResponse();
    } 

    public function refillBoard() {
        self::setAjaxMode();

        $this->game->refillBoard();

        self::ajaxResponse();
    } 

    public function playCard() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->playCard($id);

        self::ajaxResponse();
    }

    public function takeDestination() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->takeDestination($id);

        self::ajaxResponse();
    }

    public function chooseNewCard() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->chooseNewCard($id);

        self::ajaxResponse();
    }

    public function payDestination() {
        self::setAjaxMode();   

        $idsStr = self::getArg( "ids", AT_numberlist, true );
        $ids = array_map(fn($str) => intval($str), explode(',', $idsStr));
        $recruits = self::getArg("recruits", AT_posint, true);
        $this->game->payDestination($ids, $recruits);

        self::ajaxResponse();
    }

    public function reserveDestination() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->reserveDestination($id);

        self::ajaxResponse();
    }

    public function discardTableCard() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->discardTableCard($id);

        self::ajaxResponse();
    }

    public function pass() {
        self::setAjaxMode();     

        $this->game->pass();

        self::ajaxResponse();
    }

    public function trade() {
        self::setAjaxMode();     

        $number = self::getArg("number", AT_posint, true);
        $this->game->trade($number);

        self::ajaxResponse();
    }

    public function cancel() {
        self::setAjaxMode();     

        $this->game->cancel();

        self::ajaxResponse();
    }

    public function endTurn() {
        self::setAjaxMode();     

        $this->game->endTurn();

        self::ajaxResponse();
    }

    public function discardCard() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->discardCard($id);

        self::ajaxResponse();
    }
  }
  
