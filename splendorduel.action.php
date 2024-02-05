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

    public function discardTokens() {
        self::setAjaxMode();   

        $idsStr = self::getArg( "ids", AT_numberlist, true );
        $ids = array_map(fn($str) => intval($str), explode(',', $idsStr));
        $this->game->discardTokens($ids);

        self::ajaxResponse();
    }

    public function cancelUsePrivilege() {
        self::setAjaxMode();

        $this->game->cancelUsePrivilege();

        self::ajaxResponse();
    } 

    public function usePrivilege() {
        self::setAjaxMode();

        $this->game->usePrivilege();

        self::ajaxResponse();
    } 

    public function refillBoard() {
        self::setAjaxMode();

        $this->game->refillBoard();

        self::ajaxResponse();
    } 

    public function reserveCard() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->reserveCard($id);

        self::ajaxResponse();
    }

    public function buyCard() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);

        $idsStr = self::getArg( "tokensIds", AT_numberlist, true );
        $tokensIds = $idsStr == '' ? [] : array_map(fn($str) => intval($str), explode(',', $idsStr));

        $this->game->buyCard($id, $tokensIds);

        self::ajaxResponse();
    }

    public function takeRoyalCard() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->takeRoyalCard($id);

        self::ajaxResponse();
    }

    public function placeJoker() {
        self::setAjaxMode();     

        $color = self::getArg("color", AT_posint, true);
        $this->game->placeJoker($color);

        self::ajaxResponse();
    }

    public function takeOpponentToken() {
        self::setAjaxMode();     

        $id = self::getArg("id", AT_posint, true);
        $this->game->takeOpponentToken($id);

        self::ajaxResponse();
    }

    //////////////////
    ///// DEBUG  /////
    //////////////////
    public function loadBugSQL()
    {
      self::setAjaxMode();
      $reportId = (int) self::getArg('report_id', AT_int, true);
      $this->game->loadBugSQL($reportId);
      self::ajaxResponse();
    }
  }
  

